import { Filter } from "nostr-mux";
import { useEffect, useState } from "react";
import { useApp } from "./app";

const pinChannelMessage = 'pin_channel_message';

export type PinChannelLastMessageTimestamp = { [K: string]: number };

export const usePinChannelLastMessageTimestamps = () => {
  const [timestamps, setTimestamps] = useState<PinChannelLastMessageTimestamp>({});
  const { app, mux } = useApp();
  
  useEffect(() => {
    const filters: [Filter, ...Filter[]] = [{ kinds: [42], '#e': [], since: Math.floor(Date.now() / 1000) }];

    for (const ch of app.config.pinChannels) {
      filters[0]['#e'].push(ch.id);
      filters.push({ kinds: [42], '#e': [ch.id], since: ch.lastRead, limit: 1 });
    }
    
    if (filters[0]['#e'].length === 0) {
      setTimestamps({});
      return;
    }

    const unPin = Object.keys(timestamps).filter(id => !filters[0]['#e'].indexOf(id));
    if (unPin.length > 0) {
      const newTimestamps = { ...timestamps };
      for (const id of unPin) {
        delete newTimestamps[id];
      }

      setTimestamps(newTimestamps);
    }

    let unSub = false;
    
    mux.waitRelayBecomesHealthy(Math.ceil(mux.allRelays.length / 2), 2000)
      .then(() => {
        if (unSub) {
          return;
        }

        mux.subscribe({
          id: pinChannelMessage,
          filters,
          onEvent: events => {
            const e = events[0];
            const tag = e.received.event.tags.find(t => t[0] === 'e' && t[3] === 'root');
            if (!tag) {
              return;
            }

            if (!timestamps[tag[1]] || timestamps[tag[1]] < e.received.event.created_at) {
              setTimestamps({ ...timestamps, [tag[1]]: e.received.event.created_at });
            }
          },
          onRecovered: () => {
            return [{
              kinds: [42],
              '#e': app.config.pinChannels.map(ch => ch.id),
              since: Math.floor(Date.now() / 1000),
            }];
          }
        })
      });

    return () => {
      mux.unSubscribe(pinChannelMessage);
      unSub = true;
    };
  }, [app.config.pinChannels]);

  return timestamps;
};
