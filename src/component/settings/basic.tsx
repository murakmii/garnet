import { toast } from 'react-toastify';
import { utils } from 'nostr-mux';

import { useApp } from '../../state/app';
import { useProfile } from '../../state/profile';
import { Button } from '../common/form';
import './basic.scss';

export const BasicSetting = () => {
  const { app, signOut } = useApp();
  const profile = useProfile(app.pubkey);

  const doSignOut = () => {
    signOut();
    toast('サインアウトしました');
  };

  return (
    <div id="BasicSetting">
      <h3>サインイン情報</h3>
      <div className="SignIn">
        {profile && app.pubkey && (
          <>
            <img src={profile.iconURL} alt={profile.name} />
            <p>
              <b>{profile.name}</b><br />
              <span>{utils.encodeBech32ID('npub', app.pubkey)}</span>
            </p>
            <Button onClick={doSignOut}>SIGN OUT</Button>
          </>
        )}
      </div>
    </div>
  );
};
