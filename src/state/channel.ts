import { useEffect, useReducer } from "react";
import { EventMessage, Filter, RelayMessageEvent } from 'nostr-mux';

import { parseChannelMetadata, ChannelMetadata, isNewerChannelMetadata } from '../lib/nostr';
import { Channel } from "./channels";
import { useApp } from "./app";
import { channelMetadataRTagPrefix, eventIDPattern } from "../const";

export type ChannelMessage = {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
}

type ChannelState = {
  initialLoaded: boolean;
  notFound?: boolean;
  channel?: Channel;
  temporary: ChannelMetadata[];
  messages: { [K: string]: ChannelMessage };
  sortedMessages: ChannelMessage[];
};

type ChannelStateAction = ReceivedEventAction | ChangeChannelAction | InitialLoadedAction | AddMessagesAction | NotFoundAction;

type ReceivedEventAction = {
  type: 'RECEIVED_EVENT';
  message: RelayMessageEvent<EventMessage>;
};

type ChangeChannelAction = { type: 'CHANGE_CHANNEL' };
type InitialLoadedAction = { type: 'INITIAL_LOADED' };
type NotFoundAction = { type: 'NOT_FOUND' };
type AddMessagesAction = { type: 'MESSAGES', messages: ChannelMessage[] };

const channelSubID = 'channel';

const reducer = (state: ChannelState, action: ChannelStateAction): ChannelState => {
  switch (action.type) {
    case 'RECEIVED_EVENT':
      const event = action.message.received.event;
      switch (event.kind) {
        case 40:
        case 41:
          const metadata = parseChannelMetadata(event);
          if (metadata.length === 0) {
            break;
          }

          if (event.kind === 40) {
            if (!state.channel) {
              const meta = metadata[0];
              if (!meta) {
                break;
              }

              const channel: Channel = { metadata: meta, createdAt: event.created_at, relayURL: action.message.relay.url };
              for (const t of state.temporary) {
                if (isNewerChannelMetadata(channel.metadata, t)) {
                  channel.metadata = t;
                }
              }
              state = { ...state, channel: channel, temporary: [] };
            }
          } else {
            const ch = state.channel;
            if (ch) {
              const meta = metadata.find(m => m.id === ch.metadata.id);
              if (!meta) {
                break;
              }

              if (isNewerChannelMetadata(ch.metadata, meta)) {
                ch.metadata = meta;
                state = { ...state, channel: ch };
              }
            } else {
              for (const meta of metadata) {
                state.temporary.push(meta);
              }
            }
          }
          break;
      }
      break;

    case 'MESSAGES':
      for (const m of action.messages) {
        if (!state.messages[m.id]) {
          state.messages[m.id] = m;
        }
      }

      state.messages = { ...state.messages };
      state.sortedMessages = Object.values(state.messages).sort((a, b) => a.createdAt - b.createdAt);
      state = { ...state };
      break;

    case 'CHANGE_CHANNEL':
      state = { initialLoaded: false, temporary: [], messages: {}, sortedMessages: [] };
      break;

    case 'NOT_FOUND':
      state = { initialLoaded: true, temporary: [], messages: {}, sortedMessages: [], notFound: true };
      break;

    case 'INITIAL_LOADED':
      state = { ...state, initialLoaded: true };
      break;
  }

  return state;
};

const buildFullFilter = (channelID: string): [Filter, ...Filter[]] => {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      ids: [channelID],
      kinds: [40],
    },
    {
      kinds: [41],
      '#r': [channelMetadataRTagPrefix + channelID],
    },
    {
      kinds: [41],
      '#e': [channelID],
    },
    {
      kinds: [42],
      '#e': [channelID],
      until: now,
      limit: 100,
    },
    {
      kinds: [42],
      '#e': [channelID],
      since: now,
    }
  ];
};

export const useChannel = (channelID: string): ChannelState => {
  const { mux } = useApp();
  const [state, dispatch] = useReducer(reducer, { 
    initialLoaded: false,
    temporary: [], 
    messages: {},
    sortedMessages: [],
  });

  useEffect(() => {
    dispatch({ type: 'CHANGE_CHANNEL' });
    let unSub = false;

    if (!eventIDPattern.test(channelID)) {
      dispatch({ type: 'NOT_FOUND' });
      return;
    }

    mux.waitRelayBecomesHealthy(Math.ceil(mux.allRelays.length / 2), 3000)
      .then(() => {
        if (unSub) {
          return;
        }

        mux.subscribe({
          id: channelSubID,
          filters: buildFullFilter(channelID),
          onEvent: events => {
            const messages: ChannelMessage[] = [];
            for (const e of events) {
              if (e.received.event.kind === 42) {
                messages.push({
                  id: e.received.event.id,
                  pubkey: e.received.event.pubkey,
                  content: e.received.event.content,
                  createdAt: e.received.event.created_at,
                });
              } else {
                dispatch({ type: 'RECEIVED_EVENT', message: e });
              }
            }

            if (messages.length > 0) {
              dispatch({ type: 'MESSAGES', messages });
            }
          },
          enableBuffer: { flushInterval: 500 },
          onEose: () => dispatch({ type: 'INITIAL_LOADED' }),
          eoseTimeout: 5000,
          onRecovered: (_, isNew) => (
            isNew ? buildFullFilter(channelID) : [
              {
                kinds: [41, 42],
                '#e': [channelID],
                since: Math.floor(Date.now() / 1000),
              }
            ]
          ),
        })
      });

    return () => {
      unSub = true;
      mux.unSubscribe(channelSubID);
    };
  }, [channelID]);

  return state
};
