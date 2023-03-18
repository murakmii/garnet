export const defaultProfile = {
  iconURL: '/default-icon.png',
  name: 'GEMSTONE',
} as const;

export type RouteEntry = {
  key: string;
  name: string;
  link: string;
  matchURL?: string[];
};

export const helpRouteEntries: RouteEntry[] = [
  {
    key: 'publicChat',
    name: 'Public Chat機能',
    link: '/help/chat',
    matchURL: ['/help', '/help/chat'],
  },
  {
    key: 'signin',
    name: 'サインイン',
    link: '/help/signin',
  },
  {
    key: 'garnet',
    name: 'GARNETについて',
    link: '/help/garnet',
  }
];

export const settingsRouteEntries: RouteEntry[] = [
  {
    key: 'basic',
    name: '基本設定',
    link: '/settings/basic',
    matchURL: ['/settings', '/settings/basic'],
  },
  {
    key: 'relay',
    name: 'リレー設定',
    link: '/settings/relay',
  }
];

export const otherRouteEntries: RouteEntry[] = [
  {
    key: 'welcome',
    name: 'WELCOME',
    link: '/'
  }
];

export const allRouteEntries: RouteEntry[] = helpRouteEntries.concat(settingsRouteEntries).concat(otherRouteEntries);

export const eventIDPattern = /^[0-9abcdef]{64}$/;

export const channelMetadataRTagPrefix = 'https://garnet.nostrian.net/channels/';

export const welcomeMessage = `
**GARNET**へようこそ！

GARNETはNostrのPublic Chat機能に対応したクライアントソフトウェアです。
閲覧だけならサインイン不要で利用できます。

チャンネル内で発言したり、より高度な機能を利用する場合はサインインした上でご利用ください。  
ブラウザ拡張機能やその他の不明点については[ヘルプ](/help/signin)をご確認ください。
`;

export const publicChatHelp = `
**Public Chat機能**はNostrによって提供されるチャット機能です。

Public Chat対応クライアントを利用することで、チャンネルの作成やチャンネル内でのメッセージの送信を行うことができます。  
GARNETもそのようなクライアントのうちの1つです。

Public Chat機能に対応しているクライアントであれば、異なるクライアントでも同じチャンネル、同じメッセージを見ることができます。

チャンネルやメッセージは全て公開されます。
`;

export const signInHelp = `
**サインイン**してGARNETを利用することで、チャンネルの作成やチャンネル内でのメッセージの送信等が行えるようになります。

GARNETではセキュリティの観点から、NIP-07と呼ばれるNostrの仕様に準拠したブラウザ拡張機能を利用したサインインのみをサポートします。  
ブラウザ拡張機能を未導入の場合、ぜひこの機会に導入してみてください。

一例として、以下のブラウザ拡張機能が公開されています。

* Chrome: [nos2x](https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp)
* Firefox: [nos2x-fox](https://addons.mozilla.org/en-US/firefox/addon/nos2x-fox/)
`;

export const garnetHelp = `
GARNETは**murakmii**によって開発されています。  
Contact:

* [Nostr](https://snort.social/p/npub1rpqr4ygerl4357lsn02c8cm8qq4tv55tapnmmnslld37prkcprzs0flhga)
* [Twitter](https://twitter.com/murakmii)
* [mail@murakmii.dev](mailto:mail@murakmii.dev)
`;