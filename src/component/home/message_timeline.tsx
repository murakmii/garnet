import { useContext } from 'react';
import { FolloweeContext } from '../../state/followee';
import { ChannelMessageView } from '../common/channel_message_view';

import { PageHeader } from '../common/page_header';
import './message_timeline.scss';

export const MessageTimeline = () => {
  const followee = useContext(FolloweeContext);

  return (
    <div id="MessageTimeline">
      <PageHeader>
        <h2>HOME</h2>
      </PageHeader>

      <div className="PageContent">
        <div className="Timeline">
          <h3>Followees are chatting on...</h3>

          {followee.sortedMessages.map(m => (
            <ChannelMessageView key={m.id} message={m} showChannelLink />
          ))}

          {followee.sortedMessages.length > 0 && <h3>Let's go channel!</h3>}
        </div>
      </div>
    </div>
  )
};
