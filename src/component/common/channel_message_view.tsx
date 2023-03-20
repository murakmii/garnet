import { Link } from 'react-router-dom';
import { FaExternalLinkSquareAlt } from 'react-icons/fa';
import { GiNotebook } from 'react-icons/gi';

import './channel_message_view.scss';
import { ChannelMessage } from '../../state/channel';
import { useProfile } from '../../state/profile';
import { Paragraph } from './parts';

type ChannelMessageViewProps = {
  showChannelLink?: boolean;
  message: ChannelMessage;
};

export const ChannelMessageView = ({ message, showChannelLink }: ChannelMessageViewProps) => {
  const profile = useProfile(message.pubkey);

  return (
    <div className={'ChannelMessageView ' + (message.isNote ? 'Note' : '')}>
      <div className="Icon">
        {profile && (
          profile.notFound ? (
            <img src={profile.iconURL } alt={profile.name} />
          ) : (
            <Link to={`/users/${profile.pubkey}`}>
              <img src={profile.iconURL } alt={profile.name} />
            </Link>
          )
        )}
      </div>

      <div className="Body">
        <div className="Content">
          <p className="UserName">
            <b>{profile?.name || 'LOADING...'}</b>
            <i>{new Date(message.createdAt * 1000).toLocaleString()}</i>
            {showChannelLink && <Link to={`/channels/${message.channelID}`}><FaExternalLinkSquareAlt /></Link>}
          </p>
          <Paragraph className="Main">{message.content}</Paragraph>
        </div>
      </div>

      {message.isNote && (
        <GiNotebook className="Mark" />
      )}
    </div>
  )
};
