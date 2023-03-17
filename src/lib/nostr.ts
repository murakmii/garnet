import { Event } from "nostr-mux";

export type ChannelMetadata = {
  id: string;
  name?: string;
  about?: string;
  picture?: string;
  creator: string;
  createdAt: number;
};

export const isNewerChannelMetadata = (a: ChannelMetadata, b: ChannelMetadata): boolean => {
  return a.id === b.id && a.creator === b.creator && a.createdAt < b.createdAt;
};

export const parseChannelMetadata = (event: Event): ChannelMetadata | undefined => {
  if (event.kind !== 40 && event.kind !== 41) {
    return undefined;
  }

  const id = event.kind === 40 ? event.id : event.tags.find(t => t[0] === 'e')?.[1];
  if (!id) {
    return undefined;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(event.content);
  } catch {
    return undefined;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return undefined;
  }

  const { name, about, picture } = parsed;
  const metadata: ChannelMetadata = { 
    id: id, 
    creator: event.pubkey,
    createdAt: event.created_at,
  };
  
  if (typeof name === 'string' || name.length > 0) {
    metadata.name = name;
  }

  if (typeof about === 'string' && about.length > 0) {
    metadata.about = about;
  }

  if (typeof picture === 'string' && picture.length > 0) {
    metadata.picture = picture;
  }

  return metadata;
};
