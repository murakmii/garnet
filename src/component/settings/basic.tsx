import { toast } from 'react-toastify';
import { utils } from 'nostr-mux';

import { useApp } from '../../state/app';
import { useProfile } from '../../state/profile';
import { Button } from '../common/form';
import './basic.scss';

export const BasicSetting = () => {
  const { app, signOut, enableAmbientTimeline } = useApp();
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

      <h3>UI設定</h3>
      <div className="UI">
        <div className="Row">
          <input type="checkbox" 
            id="EnableAmbientTimeline" 
            onChange={(e) => enableAmbientTimeline(e.target.checked)}
            checked={app.config.enableAmbientTimeline} />
          <label htmlFor="EnableAmbientTimeline">アンビエントタイムラインを表示する</label>
        </div>
        <p className="Description">
          アンビエントタイムラインとは、チャンネルのメッセージ一覧右下に小さく表示されるタイムラインです。
        </p>
      </div>
    </div>
  );
};
