import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BiLogIn } from 'react-icons/bi';

import './page_header.scss';
import { useApp } from '../../state/app';
import { useProfile } from '../../state/profile';
import { defaultProfile } from '../../const';
import { toast } from 'react-toastify';

type PageHeaderClickableIconProps = {
  hide?: boolean;
  onClick?: () => void;
  children: ReactNode;
  link?: string;
}

export const PageHeaderClickableIcon = ({ hide, onClick, children, link }: PageHeaderClickableIconProps) => {
  const allClasses = 'PageHeaderClickableIcon ' + (hide ? 'Hide' : '');
  
  if (link) {
    return (
      <Link className={allClasses} to={link}>
        {children}
      </Link>
    );
  } else {
    return (
      <div onClick={hide ? undefined : onClick} className={allClasses}>
        {children}
      </div>
    );
  }
};

export const PageHeader = ({ children }: { children?: ReactNode }) => {
  const { app, signIn } = useApp();
  const profile = useProfile(app.pubkey);

  const clickSignIn = () => {
    if (!window.nostr?.getPublicKey) {
      toast.warn('ブラウザ拡張機能が導入されていないためサインインできません');
      return;
    }

    window.nostr.getPublicKey().then(pubkey => {
      signIn(pubkey);
      toast.success('サインインに成功しました！');
    });
  };

  return (
    <header id="PageHeader" className={children ? '' : 'Empty'}>
      {children}

      {!app.pubkey && (
        <PageHeaderClickableIcon onClick={clickSignIn}>
          <BiLogIn />
        </PageHeaderClickableIcon>
      )}

      {app.pubkey && (
        <PageHeaderClickableIcon link="/settings">
          <img className="ProfileIcon" src={profile?.iconURL || defaultProfile.iconURL} alt={profile?.name || defaultProfile.name} />
        </PageHeaderClickableIcon>
      )}
    </header>
  )
};
