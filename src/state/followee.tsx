import { ContactListEntry } from "nostr-mux";
import { useEffect, useState, useReducer, createContext, ReactNode } from "react";
import { eventIDPattern } from "../const";
import { useApp } from "./app";
import { ChannelMessage } from "./channel";

export type SimpleNote = {
  type: 'NOTE';
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
};

export type FolloweeState = {
  notes: { [K: string]: SimpleNote };
  sortedNotes: SimpleNote[];
  messages: { [K: string]: ChannelMessage };
  sortedMessages: ChannelMessage[];
};

const buildInitial = () => ({ notes: {}, sortedNotes: [], messages: {}, sortedMessages: [] });

type FolloweeStateAction = AddSimpleNotesAction | AddSimpleMessagesAction | SignedOutAction;

type AddSimpleNotesAction = {
  type: 'ADD_SIMPLE_NOTES';
  notes: SimpleNote[];
};

type AddSimpleMessagesAction = {
  type: 'ADD_MESSAGES';
  messages: ChannelMessage[];
};

type SignedOutAction = {
  type: 'SIGNED_OUT';
};

const reducer = (state: FolloweeState, action: FolloweeStateAction): FolloweeState => {
  switch (action.type) {
    case 'ADD_SIMPLE_NOTES':
      state = { ...state };
      for (const note of action.notes) {
        state.notes[note.id] = note;
      }
      state.sortedNotes = Object.values(state.notes)
        .sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
      break;

    case 'ADD_MESSAGES':
      state = { ...state };
      for (const msg of action.messages) {
        state.messages[msg.id] = msg;
      }
      state.sortedMessages = Object.values(state.messages)
        .sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
      break;

    case 'SIGNED_OUT':
      state = buildInitial();
      break;
  }

  return state;
};

const subID = 'followee';

export const useFollowee = (): FolloweeState => {
  const [state, dispatch] = useReducer(reducer, buildInitial());
  const [followee, setFollowee] = useState<string[]>([]);
  const { app, mux, personalizer } = useApp();

  // フォロイー一覧を followee で保持
  useEffect(() => {
    const self = app.pubkey;
    if (!self || !personalizer) {
      setFollowee([]);
      dispatch({ type: 'SIGNED_OUT' });
      return;
    }

    // ここで自分を追加してしまうと、Contact Listを1度も読み込んでいない状態でも
    // 自分だけのタイムラインを構成しようとしてしまい微妙なREQをCLOSEとなってしまうためまだ追加しない。
    // 初めてContact Listを受け取った際(listener内)でのみ自分自身を追加する
    setFollowee(personalizer.contactListEntries.map(e => e.pubkey));
    
    const listener = (entries: ContactListEntry[]) => {
      setFollowee(entries.map(e => e.pubkey).concat(self)); 
    };

    personalizer.onUpdatedContactList.listen(listener);
    return () => personalizer.onUpdatedContactList.stop(listener);
  }, [app.pubkey]);

  useEffect(() => {
    if (followee.length === 0) {
      return;
    }

    let unSub = false;
    const now = Math.ceil(Date.now() / 1000);

    mux.subscribe({
      id: subID,
      filters: [
        {
          kinds: [1],
          until: now,
          authors: followee,
          limit: 50,
        },
        {
          kinds: [42],
          until: now,
          authors: followee,
          limit: 50,
        },
        {
          kinds: [1, 42],
          authors: followee,
          since: now,
        }
      ],
      onEvent: events => {
        if (unSub) {
          return;
        }

        const notes: SimpleNote[] = [];
        const messages: ChannelMessage[] = [];

        for (const e of events) {
          const event = e.received.event;
          if (event.kind === 1) {
            notes.push({
              type: 'NOTE',
              id: event.id,
              pubkey: event.pubkey,
              content: event.content,
              createdAt: event.created_at,
            });
          } else {
            const root = event.tags.find(t => t[0] === 'e' && eventIDPattern.test(t[1]) && t[3] === 'root');
            if (!root) {
              continue;
            }

            messages.push({
              id: event.id,
              isNote: false,
              channelID: root[1],
              pubkey: event.pubkey,
              content: event.content,
              createdAt: event.created_at,
            });
          }
        }

        if (notes.length > 0) {
          dispatch({ type: 'ADD_SIMPLE_NOTES', notes });
        } 
        if (messages.length > 0) {
          dispatch({ type: 'ADD_MESSAGES', messages });
        }
      },
      enableBuffer: {
        flushInterval: 1000,
      },
      onRecovered: () => ([{
        kinds: [1],
        authors: followee,
        since: Math.ceil(Date.now() / 1000),
      }])
    })

    return () => {
      unSub = true;
      mux.unSubscribe(subID);
    };
  }, [followee]);

  return state;
};

export const FolloweeContext = createContext<FolloweeState>(buildInitial());
export const FolloweeContextPvovider = ({ children }: { children: ReactNode }) => {
  return (
    <FolloweeContext.Provider value={useFollowee()}>
      {children}
    </FolloweeContext.Provider>
  );
};
