import { useEffect, useReducer } from "react";
import { EventMessage, RelayMessageEvent, Filter } from 'nostr-mux';

import { ChannelMetadata, parseChannelMetadata, isNewerChannelMetadata } from '../lib/nostr';
import { useApp } from "./app";

export type Channel = {
  metadata: ChannelMetadata;
  relayURL: string;
  createdAt: number;
}

export type ChannelsState = {
  list: { [ K: string ]: Channel };
  temporary: { [K: string]: ChannelMetadata[] };
};

type ChannelsStateStateAction = ReceivedEventAction | UnSubAction | ReloadAction;

type ReceivedEventAction = { type: 'RECEIVED_EVENT', message: RelayMessageEvent<EventMessage> };
type UnSubAction = { type: 'UNSUB' };
type ReloadAction = { type: 'RELOAD' };

const reducer = (state: ChannelsState, action: ChannelsStateStateAction): ChannelsState => {
  switch (action.type) {
    case 'RECEIVED_EVENT':
      const event = action.message.received.event;
      const metadata = parseChannelMetadata(event);
      if (metadata.length === 0) {
        break;
      }

      if (event.kind === 40) {
        const meta = metadata[0];
        if (state.list[meta.id]) {
          break;
        }

        // 新規のチャンネルを受信した場合、
        // 受信済みの新しいメタデータを反映した上で状態に反映する
        const ch: Channel = { metadata: meta, relayURL: action.message.relay.url, createdAt: meta.createdAt };
        if (state.temporary[meta.id]) {
          for (const t of state.temporary[meta.id]) {
            if (isNewerChannelMetadata(ch.metadata, t)) {
              ch.metadata = t;
            }
          }
          delete state.temporary[meta.id];
        }

        state = { ...state };
        state.list[ch.metadata.id] = ch;

      } else {
        // メタデータの場合、チャンネルが分かっているなら新旧判定の上で更新、
        // チャンネルが分かっていない場合は一時的に保持し状態の更新は行わない。
        for (const meta of metadata) {
          const ch = state.list[meta.id];
          if (ch) {
            if (isNewerChannelMetadata(ch.metadata, meta)) {
              state = { ...state };
              state.list[meta.id] = { ...ch, metadata: meta };
            }
          } else {
            if (!state.temporary[meta.id]) {
              state.temporary[meta.id] = [];
            }
            state.temporary[meta.id].push(meta);
          }
        }
      }
      break;

    case 'UNSUB':
      state = { list: state.list, temporary: {} };
      break;
  }

  return state;
}

// 指定のフィルタに一致するチャンネル一覧を状態として返す。
// フィルタに一致するイベントはkind: 40, 41のもののみとなるようにすること。
export const useChannels = ({ pubkey, subID, filters }: { pubkey?: string, subID: string, filters: [Filter, ...Filter[]] | undefined }): ChannelsState => {
  const { mux } = useApp();
  const [state, dispatch] = useReducer(reducer, { list: {}, temporary: {} });

  useEffect(() => {
    if (!filters) {
      return;
    }

    dispatch({ type: 'RELOAD' });

    // チャンネル一覧のためにサブスクリプションを1つ使うのは無駄なので、長めに取得した後切断する
    let unSub: NodeJS.Timeout | undefined = setTimeout(() => {
      if (!unSub) {
        mux.unSubscribe(subID);
        dispatch({ type: 'UNSUB' });
        unSub = undefined;
      }
    }, 30000);
  
    mux.waitRelayBecomesHealthy(Math.ceil(mux.allRelays.length / 2), 5000)
      .then(() => {
        if (!unSub) {
          return;
        }

        mux.subscribe({
          id: subID,
          filters,
          onEvent: (message) => {
            for (const m of message) {
              dispatch({ type: 'RECEIVED_EVENT', message: m });
            }
          },
          enableBuffer: { flushInterval: 500 },
          eoseTimeout: 30000,
          onRecovered: (_, isNew) => isNew ? filters : [],
        })
      });

    return () => {
      clearTimeout(unSub);
      mux.unSubscribe(subID);
      unSub = undefined;
    };
  }, [pubkey, subID, filters]);

  return state;
};
