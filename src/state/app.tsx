import React, { ReactNode, useReducer, useContext } from "react";
import { Mux, Relay, LogLevel, AutoRelayList, AutoProfileSubscriber, GenericProfile, parseGenericProfile } from 'nostr-mux';

export type AppContext = {
  app: AppState;

  mux: Mux;
  autoProfileSub: AutoProfileSubscriber<GenericProfile>;
  autoRelayList: AutoRelayList;

  signIn: (pubkey: string) => void;
  signOut: () => void;
  pinChannel: (channel: string, lastRead: number) => void;
  unPinChannel: (channel: string) => void;
  readChatMessage: (channel: string, timestamp: number) => void;
};

export type Config = {
  pinChannels: { id: string, lastRead: number }[];
}

type AppState = {
  pubkey?: string;
  config: Config;
};

type AppStateAction = SignInAction | SignOutAction | PinChannelAction | UnPinChannelAction | ReadChatMessage;

type SignInAction = { type: 'SIGN_IN', pubkey: string };
type SignOutAction = { type: 'SIGN_OUT' };
type PinChannelAction = { type: 'PIN_CHANNEL', channel: string, lastRead: number };
type UnPinChannelAction = { type: 'UNPIN_CHANNEL', channel: string };
type ReadChatMessage = { type: 'READ_CHAT_MESSAGE', channel: string, timestamp: number };

const pubkeyConfig = 'garnet.pubkey';
const configKey = 'garnet.config';

const pubkey = localStorage.getItem(pubkeyConfig) || undefined;

const defaultRelays = [
  'wss://relay.snort.social',
  'wss://relay.damus.io',
  'wss://nostr.fediverse.jp',
  'wss://relay-jp.nostr.wirednet.jp',
];

const mux = new Mux();
for (const relayURL of defaultRelays) {
  mux.addRelay(new Relay(relayURL, { 
    logger: LogLevel.info, 
    watchDogInterval: 300 * 1000
  }));
}

const autoRelayList = new AutoRelayList({ 
  pubkey,
  logger: LogLevel.info,
  relayOptionsTemplate: { 
    watchDogInterval: 300 * 1000
  }
});

const autoProfileSub = new AutoProfileSubscriber<GenericProfile>({
  parser: parseGenericProfile,
  autoEvict: false,
  collectPubkeyFromEvent: (e, relayURL) => {
    return (relayURL && e.kind === 42) ? [e.pubkey] : [];
  },
  tickInterval: 1000,
});

mux.installPlugin(autoRelayList);
mux.installPlugin(autoProfileSub);

const App = React.createContext<AppContext>({
  app: { pubkey, config: { pinChannels: [] } },

  mux,
  autoProfileSub,
  autoRelayList,

  signIn: () => {}, 
  signOut: () => {},
  pinChannel: () => {},
  unPinChannel: () => {},
  readChatMessage: () => {},
});

const reducer = (state: AppState, action: AppStateAction): AppState => {
  if (!state.pubkey && action.type !== 'SIGN_IN') {
    return state;
  }

  switch (action.type) {
    case 'SIGN_IN':
      if (state.pubkey !== action.pubkey) {
        state = { pubkey: action.pubkey, config: parseConfig() };
        autoRelayList.updatePubkey(action.pubkey);
        localStorage.setItem(pubkeyConfig, action.pubkey);
      }
      break;
    
    case 'SIGN_OUT':
      if (state.pubkey) {
        state = { pubkey: undefined, config: { pinChannels: [] } };
        autoRelayList.updatePubkey(null);
        localStorage.removeItem(pubkeyConfig);
      }
      break;

    case 'PIN_CHANNEL':
      if (!state.config.pinChannels.find(c => c.id === action.channel)) {
        state = { ...state };
        state.config.pinChannels = state.config.pinChannels.concat({
          id: action.channel,
          lastRead: action.lastRead,
        });
        localStorage.setItem(configKey, JSON.stringify(state.config));
      }
      break;

    case 'UNPIN_CHANNEL':
      state = { ...state };
      state.config.pinChannels = state.config.pinChannels.filter(c => c.id !== action.channel);
      localStorage.setItem(configKey, JSON.stringify(state.config));
      break;

    case 'READ_CHAT_MESSAGE':
      for (const ch of state.config.pinChannels) {
        if (ch.id === action.channel && ch.lastRead < action.timestamp) {
          ch.lastRead = action.timestamp;
          localStorage.setItem(configKey, JSON.stringify(state.config));
        }
      }
      break;
  }

  return state;
};

const parseConfig = (): Config => {
  let mayBeConfig: any;
  try {
    mayBeConfig = JSON.parse(localStorage.getItem(configKey) || '{}');
  } catch {
    return { pinChannels: [] };
  }

  if (mayBeConfig === null || Array.isArray(mayBeConfig) || typeof mayBeConfig !== 'object') {
    return { pinChannels: [] };
  }

  const config: Config = { pinChannels: [] };
  const { pinChannels } = mayBeConfig;

  if (Array.isArray(pinChannels)) {
    for (const ch of pinChannels) {
      if (typeof ch === 'string') {
        config.pinChannels.push({ id: ch, lastRead: 0 });
      } else if (ch !== null && !Array.isArray(ch) && typeof ch === 'object') {
        const { id, lastRead } = ch;
        if (typeof id === 'string' && typeof lastRead === 'number') {
          config.pinChannels.push({ id, lastRead });
        }
      }
    }
  }

  return config;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, { pubkey, config: pubkey ? parseConfig() : { pinChannels: [] } });

  const signIn = (pubkey: string) => dispatch({ type: 'SIGN_IN', pubkey });
  const signOut = () => dispatch({ type: 'SIGN_OUT' });
  const pinChannel = (channel: string, lastRead: number) => dispatch({ type: 'PIN_CHANNEL', channel, lastRead });
  const unPinChannel = (channel: string) => dispatch({ type: 'UNPIN_CHANNEL', channel });
  const readChatMessage = (channel: string, timestamp: number) => dispatch({ type: 'READ_CHAT_MESSAGE', channel, timestamp });

  const ctx = {
    app: state,

    mux,
    autoProfileSub,
    autoRelayList,

    signIn,
    signOut,
    pinChannel,
    unPinChannel,
    readChatMessage,
  }

  return (
    <App.Provider value={ctx}>
      {children}
    </App.Provider>
  );
};

export const useApp = () => {
  return useContext(App);
};
