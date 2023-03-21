import { Event } from "nostr-mux";

export type ChannelProperties = {
  id?: string;
  name?: string;
  about?: string;
  picture?: string;
  youtube?: string
}

export type ChannelMetadata = {
  id: string;
  creator: string;
  createdAt: number;
} & ChannelProperties;

export const isNewerChannelMetadata = (a: ChannelMetadata, b: ChannelMetadata): boolean => {
  return a.id === b.id && a.creator === b.creator && a.createdAt < b.createdAt;
};

/*
kind:41は2023/03/18時点で1 pubkeyにつき1つしか持てないため、
以下のような仕様のcontent及びtagsとすることで複数チャンネルのメタデータを保持できるようにする。

* tagsにはイベントが持つ全てのチャンネルメタデータに対応するチャンネルIDを持たせる
  * 直近変更したチャンネルのIDは、他のクライアントとの互換性のためeタグとして持つ
  * 上記を含めた全てのチャンネルのIDは、GARNETのURLとしてrタグとして持つ
* contentのJSONは、
  * 互換性のため、直近変更したチャンネルのメタデータはトップレベルにname, about, pictureプロパティ等として持つ
  * rタグで示されるチャンネルのIDに対応するチャンネルのメタデータはchannelsプロパティに配列として持つ
    * channelsプロパティの配列の要素は、name, about, pictureといったチャンネルのメタデータの他、チャンネルのIDを示すidプロパティを持つ

GARNET以外からは、このようなイベントは従来通りのkind:41として見える。
(直近変更したチャンネルのメタデータをcontentとして持ち、対象チャンネルのIDをeタグとして持つ)
全てのチャンネルのIDをeタグとしてしまうと、他クライアントにおいて意図しないkind:41がREQで返ってくるケースが想定されるため、
直近変更したチャンネルのID以外はrタグで持たせる。

GARNETの場合、特定チャンネルのメタデータを取得する場合はeタグとrタグそれぞれを条件にしてREQする。
チャンネルの作成者が分かっている場合、authorsを指定すれば良いのでrタグは無くても問題ないが、
その場合チャンネル(kind:40)を必ず先に取得しなければpubkeyが分からずチャンネルメタデータの開始がその分遅くなってしまう。
rタグにチャンネルIDを含む方針であれば、kind:40と41の取得を同時に行えるためrタグを活用する。

```js
{
  ...
  kind: 41,
  content: JSON.stringify({
    name: 'channel 2',
    about: 'this is channel 2',
    channels: [
      {
        id: 'CHANNELID1'
        name: '...',
        about: '...',
      },
      {
        id: 'CHANNELID2'
        name: '...',
        about: '...',
      },
      {
        id: 'CHANNELID3'
        name: '...',
        about: '...',
      }
    ]
  })
  ...
  tags: [
    ['e', 'CHANNELID2'],
    ['r', 'https://garnet.nostrian.net/channels/CHANNELID1'],
    ['r', 'https://garnet.nostrian.net/channels/CHANNELID2'],
    ['r', 'https://garnet.nostrian.net/channels/CHANNELID3']
  ]
  ...
}
```
*/
export const parseChannelMetadata = (event: Event): ChannelMetadata[] => {
  if (event.kind !== 40 && event.kind !== 41) {
    return [];
  }

  let parsed: any;
  try {
    parsed = JSON.parse(event.content);
  } catch {
    return [];
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return [];
  }

  if (event.kind === 40) {
    const props = parseChannelProperties(parsed);
    return props ? [
      { ...props, id: event.id, creator: event.pubkey, createdAt: event.created_at }
    ] : [];
  }

  const result: ChannelMetadata[] = [];
  const allMetadata = parseGARNETStyleChannelProperties(parsed);
  for (const meta of allMetadata) {
    if (!meta.id) {
      meta.id = event.tags.find(t => t[0] === 'e')?.[1];
    }

    const id = meta.id;
    if (!id) {
      continue;
    }

    // rタグとは突き合わせしない
    result.push({ ...meta, id, creator: event.pubkey, createdAt: event.created_at });
  }

  return result;
};

const parseChannelProperties = (mayBeProps: any): ChannelProperties | undefined =>  {
  const { id, name, about, picture, youtube } = mayBeProps;
  const props: ChannelProperties = {};

  if (typeof id === 'string' && id.length > 0) {
    props.id = id;
  }
  
  if (typeof name === 'string' && name.length > 0) {
    props.name = name;
  }

  if (typeof about === 'string' && about.length > 0) {
    props.about = about;
  }

  if (typeof picture === 'string' && picture.length > 0) {
    props.picture = picture;
  }

  if (typeof youtube === 'string' && youtube.length > 0) {
    props.youtube = youtube;
  }

  return props;
}

const parseGARNETStyleChannelProperties = (mayBeGARNETStyle: any): ChannelProperties[] => {
  const result: ChannelProperties[] = [];

  const topLevel = parseChannelProperties(mayBeGARNETStyle); 
  if (topLevel) {
    topLevel.id = undefined; // トップレベルでidが見つかる場合はGARNETでは支障があるかもしれないので破棄
    result.push(topLevel);
  }

  const { channels } = mayBeGARNETStyle;
  if (!Array.isArray(channels)) {
    return result;
  }

  for (const mayBeProps of channels) {
    const props = parseChannelProperties(mayBeProps);
    if (props?.id) { // channelsに含まれていてidが無いものは扱いようがないので破棄
      result.push(props);
    }
  }

  return result;
}
