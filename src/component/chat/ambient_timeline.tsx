import { useContext } from 'react';
import { BsFillGearFill } from 'react-icons/bs';

import { FolloweeContext, SimpleNote } from '../../state/followee';
import { useProfile } from '../../state/profile';

import './ambient_timeline.scss';

const Note = ({ note }: { note: SimpleNote }) => {
  const profile = useProfile(note.pubkey);

  return (
    <div className="Note">
      <div className="Icon">
        {profile && <img src={profile.iconURL} />}
      </div>
      <p>{note.content}</p>
    </div>
  )
};

export const AmbientTimeline = () => {
  const followee = useContext(FolloweeContext);

  return (
    <div id="AmbientTimeline">
      <div className="Notes">
        {followee.sortedNotes.slice(0, 20).map(n => <Note key={n.id} note={n} />)}
      </div>
    </div>
  )
};