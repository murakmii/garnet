import { toast } from 'react-toastify';
import { utils } from 'nostr-mux';

import { useApp } from '../../state/app';
import { useProfile } from '../../state/profile';
import { Button } from '../common/form';
import './basic.scss';
import { T } from '../../hooks/i18n';

export const BasicSetting = () => {
  const { app, signOut, changeLang } = useApp();
  const profile = useProfile(app.pubkey);

  const doSignOut = () => {
    signOut();
    toast('サインアウトしました');
  };

  const doChangeLang = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeLang(e.target.value === 'en' ? 'en' : 'ja');
  };

  return (
    <div id="BasicSetting">
      <h3><T transKey="settings_basic_sign_in" /></h3>
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

      <h3><T transKey="settings_basic_lang" /></h3>
      <p className="Lang Category">
        <input type="radio" name="lang" id="LangEn" value="en" checked={app.config.lang === 'en'} onChange={doChangeLang} />
        <label htmlFor="LangEn"><T transKey="en" /></label><br />
        <input type="radio" name="lang" id="LangJa" value="ja" checked={app.config.lang === 'ja'} onChange={doChangeLang} />
        <label htmlFor="LangJa"><T transKey="ja" /></label>
      </p>
    </div>
  );
};
