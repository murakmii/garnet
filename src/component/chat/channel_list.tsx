import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearchPlus } from 'react-icons/fa';
import { useLocation, useParams } from 'react-router';

import './channel_list.scss';
import { ChannelsState } from '../../state/channels';
import { useApp } from '../../state/app';
import { PinChannelLastMessageTimestamp } from '../../state/pin_channel_last_message_timestamps';

const ChannelItem = ({ unRead, selected, name, id }: { unRead?: boolean, selected: boolean, name?: string, id: string }) => {
  if (selected) {
    return <li className="Selected"><Link to={`/channels/${id}`}>{name || id}</Link></li>
  } else {
    return <li className={unRead ? 'UnRead' : ''}><Link to={`/channels/${id}`}>{name || id}</Link></li>
  }
};

export const ChannelList = ({ channels, timestamps }: {channels: ChannelsState, timestamps: PinChannelLastMessageTimestamp}) => {
  const { channelID } = useParams(); 
  const { app } = useApp();
  const path = useLocation().pathname;
  const shownChannel = path.startsWith('/channels/');

  const sortedChannels = Object.values(channels.list).sort((a, b) => b.createdAt - a.createdAt);
  const pinChannels = app.config.pinChannels;
  const pinChannelsSet = new Set(pinChannels.map(c => c.id));
  const [unRead, setUnRead] = useState<string[]>([]);

  useEffect(() => {
    const newUnRead: string[] = [];
    for (const ch of pinChannels) {
      if (shownChannel && channelID && ch.id === channelID) {
        continue;
      }

      if (timestamps[ch.id] && timestamps[ch.id] > ch.lastRead) {
        newUnRead.push(ch.id);
      }
    }

    setUnRead(newUnRead);
  }, [shownChannel, channelID, pinChannels, timestamps]);

  return (
    <div id="ChannelList">
      <div className="WithButtonHeader">
        <h2>CHAT</h2>
        {path !== '/channels' && <Link to="/channels"><FaSearchPlus /></Link>}
      </div>

      {app.pubkey && (
        <>
          <h3>PIN</h3>
          <ul className="Pin">
            {pinChannels.length > 0 ? (
              pinChannels.map(c => (
                <ChannelItem 
                  key={c.id} 
                  id={c.id} 
                  unRead={unRead.indexOf(c.id) !== -1}
                  selected={channelID === c.id} 
                  name={channels.list[c.id]?.metadata.name || c.id} />
              ))
            ) : (
              <li className="NotSelectable"><i>NO CHANNELS</i></li>
            )}
          </ul>
        </>
      )}

      <h3>ALL</h3>
      <ul>
        {sortedChannels.map(ch => (
          pinChannelsSet.has(ch.metadata.id) ? (
            null
          ) : (
            <ChannelItem key={ch.metadata.id} id={ch.metadata.id} name={ch.metadata.name} selected={channelID === ch.metadata.id} />
          )
        ))}
      </ul>
    </div>
  );
};