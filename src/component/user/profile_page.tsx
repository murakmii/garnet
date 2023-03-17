import { useParams } from 'react-router';
import { utils } from 'nostr-mux';
import { FaUser } from 'react-icons/fa';

import './profile_page.scss';
import { useProfile } from '../../state/profile';
import { PageHeader } from '../common/page_header';
import { Component, ErrorHeader, ExternalLink, Paragraph } from '../common/parts';

export const ProfilePage = () => {
  const profile = useProfile(useParams().pubkey as string);
  
  return (
    <div id="ProfilePage">
      <PageHeader>
        <h2>
          <FaUser style={{ width: '15px', height: '15px', paddingRight: '10px' }} />
          USER PROFILE
        </h2>
      </PageHeader>
      <div className="PageContent">
        {profile && !profile.notFound ? (
          <Component>
            <div className="Profile">
              <img src={profile.iconURL} alt={profile.name} />
              <p>
                <b>{profile.name}</b><br />
                <span>{utils.encodeBech32ID('npub', profile.pubkey)}</span>
                {profile.about && <Paragraph className="About">{profile.about}</Paragraph>}
              </p>
            </div>
            <p className="Links">
              View on SNS client:
              <ExternalLink to={`https://snort.social/p/${profile.pubkey}`}>Snort</ExternalLink>
              <ExternalLink to={`https://iris.to/${utils.encodeBech32ID('npub', profile.pubkey)}`}>iris</ExternalLink>
            </p>
          </Component>
        ) : ( 
          profile ? (
            <ErrorHeader>User not found</ErrorHeader>
          ) : (
            null
          )
        )}
      </div>
    </div>
  );
};
