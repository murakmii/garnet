import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BsPinAngleFill, BsPinAngle, BsSendFill } from 'react-icons/bs';
import { AiFillExperiment } from 'react-icons/ai';
import { FaEdit, FaCopy } from 'react-icons/fa';
import { MdHelp } from 'react-icons/md';
import { Link } from 'react-router-dom';

import './channel_view.scss';
import { Channel } from '../../state/channels';
import { useChannel } from '../../state/channel';
import { Button, TextArea, CheckBox } from '../common/form';
import { PageHeader } from '../common/page_header';
import { useApp } from '../../state/app';
import { useProfile } from '../../state/profile';
import { useResizing } from '../../state/resizing';
import { ChannelForm } from '../common/channel_form';
import { DialogBackground, ErrorHeader, Markdown } from '../common/parts';
import { PageHeaderClickableIcon } from '../common/page_header';
import { ChannelMessageView } from '../common/channel_message_view';
import { translate } from '../../lib/i18n';
import { channelURLPrefix, youtubeURLPattern } from '../../const';
import { TimelineBar } from './timeline_bar';

const emptyMatcher = /^\s*$/;

const Form = ({ channel }: { channel?: Channel }) => {
  const [inputContent, setInputContent] = useState('');
  const [asNote, setAsNote] = useState(false);

  const { app, mux, signIn } = useApp();
  const signedIn = !!app.pubkey;

  useEffect(() => {
    setAsNote(false);
    setInputContent('');
  }, [channel?.metadata.id]);

  const doSignIn = () => {
    if (!window.nostr?.getPublicKey) {
      toast.warn(translate(app.config.lang, 'toast_failed_sign_in_no_nip07'));
      return;
    }

    window.nostr.getPublicKey().then(pubkey => {
      toast.success(translate(app.config.lang, 'toast_succeeded_sign_in'));
      signIn(pubkey);
    });
  };
  
  const onChange = (_: string, value: string) => {
    setInputContent(value);
  };

  const send = () => {
    if (!app.pubkey || !channel) {
      return;
    }

    if (!window.nostr?.signEvent) {
      toast.warn('ブラウザ拡張機能が導入されていないためメッセージを送信できません');
      return;
    }

    if (mux.healthyRelays.length === 0) {
      toast.warn('リレーに接続されていません');
      return;
    }

    const event = {
      kind: asNote ? 1 : 42,
      pubkey: app.pubkey,
      content: inputContent,
      tags: [asNote ? (
        ['r', channelURLPrefix + channel.metadata.id]
      ) : (
        ['e', channel.metadata.id, channel.relayURL, 'root']
      )],
      created_at: Math.floor(Date.now() / 1000),
    };

    let acceptedOnce = false;
    setInputContent('');
    setAsNote(false);

    window.nostr.signEvent(event)
      .then(e => {
        mux.publish(e, {
          timeout: 10000,
          onResult: (result) => {
            if (!acceptedOnce && result.received.accepted) {
              acceptedOnce = true;
            }
          },
          onComplete: () => {
            if (!acceptedOnce) {
              toast.warn('メッセージの送信に失敗しました');
            }
          }
        });
      })
      .catch(() => {
        toast.warn('メッセージへの署名が拒否されました');
      });
  };

  return (
    <form name="inputMessage" onSubmit={(e: React.FormEvent) => e.preventDefault()}>
      <TextArea name="content" multiline={true} placeholder={translate(app.config.lang, "hello")} value={inputContent} onChange={onChange} onSubmitByKey={send} disabled={!signedIn} />
      
      <div className="Buttons">
        <Link to="/help"><MdHelp /></Link>
        <div className="Space"></div>
      
        <CheckBox name="asNote" checked={asNote} onChange={e => setAsNote(e.target.checked)}>
          Shared
          <AiFillExperiment />
        </CheckBox>
        
        <Button disabled={!signedIn || emptyMatcher.test(inputContent)} onClick={send}><BsSendFill /></Button>
      </div>

      {!signedIn && <div className="RequireSignIn"><Button onClick={doSignIn}>SIGN IN</Button></div>}
    </form> 
  );
};

const YouTubeViewer = ({ videoID }: { videoID: string }) => {
  return (
    <div id="YouTubeViewer">
      <iframe 
        id="player" 
        src={`https://www.youtube.com/embed/${videoID}?origin=https://garnet.nostrian.net`}
        frameBorder="0">  
      </iframe>
    </div>
  )
};

type Tab = 'metadata' | 'timeline';

export const ChannelView = () => {
  const channelID = useParams().channelID as string;
  
  const { app, pinChannel, unPinChannel, readChatMessage } = useApp();
  const [selectedTab, setSelectedTab] = useState<Tab>(app.pubkey ? 'timeline' : 'metadata');
  const pin = app.config.pinChannels.find(c => c.id === channelID);
  const state = useChannel(channelID);
  const ownerIsMe = app.pubkey && app.pubkey === state.channel?.metadata.creator;
  const messages = state.sortedMessages;
  const creator = useProfile(state.channel?.metadata.creator);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false); 

  const [fitBottom, setFitBottom] = useState(true);
  const messagesRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    setFitBottom(true);
    setShowMetadataEditor(false);
    readChatMessage(channelID, Math.floor(Date.now() / 1000));
  }, [channelID]);

  useEffect(() => {
    if (messages.length > 0) {
      readChatMessage(channelID, messages[messages.length - 1].createdAt);
    }
  }, [messages.length]);

  // スクロールバーが下限の状態でリサイズした場合は下限の状態を維持する
  useEffect(() => {
    if (!fitBottom) {
      return;
    }

    const listener = () => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    };

    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [fitBottom]);

  // 再描画時は必ず下限チェック
  useEffect(() => {
    if (fitBottom && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  });

  // スクロール位置の変更に応じて下限フラグを更新する
  // ただしウィンドウリサイズ中は更新を無効にする
  const onScrollMessages = useResizing() ? undefined : (e: React.UIEvent<HTMLDivElement>) => {
    setFitBottom(e.currentTarget.clientHeight + Math.ceil(e.currentTarget.scrollTop) + 10 >= e.currentTarget.scrollHeight);
  };

  const editMetadata = () => setShowMetadataEditor(true);
  const closeMetadata = () => setShowMetadataEditor(false);

  const copyID = () => {
    if (state.channel) {
      navigator.clipboard.writeText(state.channel.metadata.id);
      toast.success('チャンネルIDをコピーしました！このIDは検索画面等で使うことができます', { pauseOnFocusLoss: false, autoClose: 4000 });
    }
  };

  if (state.notFound) {
    return (
      <div id="ChannelView">
        <PageHeader>
          <h2>CHANNEL</h2>
        </PageHeader>

        <div className="PageContent">
          <ErrorHeader>Channel ID is INVALID</ErrorHeader>
        </div>
      </div>
    );
  }

  const ytVideoID = (state.channel?.metadata.youtube || '').match(youtubeURLPattern)?.[1];

  const onClickTab = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.currentTarget.classList.contains("Selected")) {
      return;
    }

    setSelectedTab(e.currentTarget.dataset.tab === 'metadata' ? 'metadata' : 'timeline');
  };

  return (
    <div id="ChannelView">
      <PageHeader>
        {app.pubkey && (
          <PageHeaderClickableIcon onClick={() => pin ? unPinChannel(channelID) : pinChannel(channelID, messages.length > 0 ? messages[messages.length - 1].createdAt : 0)}>
            {pin ? <BsPinAngleFill /> : <BsPinAngle />}
          </PageHeaderClickableIcon>
        )}

        <h2>{state.channel?.metadata.name || 'LOADING...'}{state.channel && <FaCopy onClick={copyID} />}</h2>
      </PageHeader>

      <div className="PageContent">
        <div className={"Center " + (ytVideoID ? 'Theater' : '')}>
          {ytVideoID && (
            <div id="Theater">
              <YouTubeViewer videoID={ytVideoID} />
            </div>
          )}

          <div className="Messages" onScroll={onScrollMessages} ref={messagesRef}>
            {messages.map(m => <ChannelMessageView key={m.id} message={m} />)}
          </div>

          <Form channel={state.channel} />
        </div>

        <div className="ChannelMetadata">
          <div className="Tabs">
            {app.pubkey && (
              <div data-tab="timeline" className={"Tab " + (selectedTab === 'timeline' ? 'Selected' : '')} onClick={onClickTab}>
                TIMELINE
              </div>
            )}
            <div data-tab="metadata" className={"Tab " + (selectedTab === 'metadata' ? 'Selected' : '')} onClick={onClickTab}>
              INFO
            </div>
          </div>

          <div className="TabPage">
            {selectedTab === 'metadata' && (
              <div className={"Metadata " + (selectedTab === 'metadata' ? 'Selected' : '')}>
                {state.channel?.metadata.picture && (
                  <div className="Banner" style={{ backgroundImage: `url(${state.channel?.metadata.picture})` }}>
                  </div>
                )}

                {state.channel && (
                  <>
                    <h3 className="About">
                      ABOUT
                      {ownerIsMe && <><FaEdit onClick={editMetadata} /><span /></>}
                    </h3>
                    {state.channel?.metadata.about ? <Markdown md={state.channel?.metadata.about} /> : <p>No description</p>}
                  </>
                )}

                {creator && (
                  <>
                    <h3>OWNER</h3>
                    <div className="Creator">
                      <Link to={`/users/${creator.pubkey}`}>
                        <img src={creator.iconURL} alt={creator.name} />
                      </Link>
                      <b className={creator.notFound ? 'Pseudo' : ''}>{creator.name}</b>
                    </div>
                  </>
                )}
              </div>
            )}

            {selectedTab === 'timeline' && <TimelineBar />}
          </div>
        </div>

        {showMetadataEditor && (
          <DialogBackground>
            <ChannelForm 
              title="EDIT" 
              channel={state.channel}
              onClose={closeMetadata} />
          </DialogBackground>
        )}
      </div>
    </div>
  )
};
