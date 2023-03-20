import { useContext, useEffect, useRef, useState } from 'react';

import './timeline_bar.scss';
import { FolloweeContext, SimpleNote } from '../../state/followee';
import { useProfile } from '../../state/profile';
import { useResizing } from '../../state/resizing';

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

export const TimelineBar = () => {
  const tlBar = useRef<HTMLDivElement>(null);
  const followee = useContext(FolloweeContext);
  const [maxNotes, setMaxNotes] = useState(100);

  const resizing = useResizing();
  useEffect(() => {
    if (!resizing && tlBar.current) {
      // ノート1つ1つの高さは最低34px(アイコン24px + マージン10px)と決まっているため、
      // clientHeightを埋めるのに十分な数を求めて全体を描画しないようにする
      setMaxNotes(Math.ceil(tlBar.current.clientHeight / 34));
    }
  }, [resizing]);

  return (
    <div id="TimelineBar" ref={tlBar}>
      <div className="Notes">
        {followee.sortedNotes.slice(0, maxNotes).map(n => <Note key={n.id} note={n} />)}
      </div>
    </div>
  )
};
