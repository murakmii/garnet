import { useState, useEffect } from "react";

import { useApp } from "./app";
import { ChannelMetadata, parseChannelMetadata } from "../lib/nostr";

export const useChannelMetadata = (enable: boolean): ChannelMetadata[] => {
  const { app, personalizer } = useApp();
  const [metadata, setMetadata] = useState<ChannelMetadata[]>([]);

  useEffect(() => {
    if (!app.pubkey || !personalizer || !enable) {
      return;
    }

    const kind41 = personalizer.getCachedReplaceableEvent(41);
    if (kind41) {
      setMetadata(parseChannelMetadata(kind41));
    }

    personalizer.onUpdatedReplaceableEvent.listen(event => {
      if (event.kind !== 41) {
        return;
      }

      setMetadata(parseChannelMetadata(event));
    });
  }, [app.pubkey, enable]);

  return metadata;
};
