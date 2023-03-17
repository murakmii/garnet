import { useState, useEffect } from "react";
import { utils } from 'nostr-mux';

import { useApp } from "./app";
import { defaultProfile, eventIDPattern } from "../const";

export type Profile = {
  pubkey: string;
  name: string;
  about?: string;
  iconURL: string;
  notFound: boolean;
}

// 指定のpubkeyに応じたプロフィールを状態として返す
// 取得できていない場合はundefined
export const useProfile = (pubkey?: string): Profile | undefined => {
  const { autoProfileSub } = useApp();
  const [profile, setProfile] = useState<Profile | undefined>();

  useEffect(() => {
    if (!pubkey) {
      setProfile(undefined);
      return;
    }

    let normalizedPubkey = pubkey;
    if (!eventIDPattern.test(normalizedPubkey)) {
      const decoded = utils.decodeBech32ID(normalizedPubkey);
      
      if (!decoded || decoded.prefix !== 'npub') {
        setProfile({ name: defaultProfile.name, iconURL: defaultProfile.iconURL, notFound: true, pubkey: '' });
        return;
      }

      normalizedPubkey = decoded.hexID;
    }

    let unmount = false;

    autoProfileSub
      .get(normalizedPubkey)
      .then(result => {
        if (!unmount) {
          if (result) {
            const display = result.properties.displayName || '';
            const name = result.properties.name || '';
            const pic = result.properties.picture || '';

            setProfile({
              pubkey: normalizedPubkey,
              name: display.length > 0 ? display : (name.length > 0 ? name : defaultProfile.name),
              iconURL: pic.length > 0 && (pic.startsWith('http') || pic.startsWith('data:image/')) ? pic : defaultProfile.iconURL,
              about: result.properties.about,
              notFound: false,
            })
          } else {
            setProfile({ name: defaultProfile.name, iconURL: defaultProfile.iconURL, notFound: true, pubkey: '' });
          }
        }
      });

    return () => { unmount = true };
  }, [pubkey]);

  return profile;
}
