import React, { useState, useEffect } from 'react';
import { MdClose, MdHelp } from 'react-icons/md';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

import './channel_form.scss';
import { Button, TextArea } from './form';
import { useApp } from '../../state/app';
import { Event, Tag } from 'nostr-mux';
import { Channel } from '../../state/channels';
import { ChannelMetadata } from '../../lib/nostr';
import { useChannelMetadata } from '../../state/channel_metadata';
import { channelURLPrefix } from '../../const';

export type ChannelFormProps = {
  title: string;
  channel?: Channel;
  onClose?: () => void;
}

type Values = {
  name: string;
  about: string;
  picture: string;
};

type ValidatedValues = {
  name: string;
  about?: string;
  picture?: string;
};

const buildEventForCreation = (values: ValidatedValues): Promise<Event> => {
  const event = {
    kind: 40,
    content: JSON.stringify(values),
    tags: [],
    created_at: Math.floor(Date.now() / 1000),
  };

  return window.nostr.signEvent(event);
}

const buildEventForUpdate = (channel: Channel, values: ValidatedValues, metadata: ChannelMetadata[]): Promise<Event> => {
  metadata = Object.values(metadata.reduce((obj, meta) => {
    obj[meta.id] = meta;
    return obj;
  }, {} as { [K: string]: ChannelMetadata }));

  const channels: { id: string, name?: string, about?: string, picture?: string }[] = [{ ...values, id: channel.metadata.id }];
  const tags: Tag[] = [
    ['e', channel.metadata.id, channel.relayURL],
    ['r', channelURLPrefix + channel.metadata.id],
  ];

  for (const meta of metadata) {
    if (meta.id === channel.metadata.id) {
      continue;
    }

    channels.push({ id: meta.id, name: meta.name || '', about: meta.about, picture: meta.picture })
    tags.push(['r', channelURLPrefix + meta.id]);
  }

  const event = {
    kind: 41,
    content:  JSON.stringify({ ...values, channels }),
    tags: tags,
    created_at: Math.floor(Date.now() / 1000),
  }

  return window.nostr.signEvent(event);
}

export const ChannelForm = ({title, channel, onClose }: ChannelFormProps) => {
  const { mux } = useApp();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const metadata = useChannelMetadata(!!channel);
  const [done, setDone] = useState<string | undefined>();
  const [valid, setValid] = useState(false);
  const [values, setValues] = useState<Values>({ 
    name: channel?.metadata.name || '', 
    about: channel?.metadata?.about || '', 
    picture: channel?.metadata?.picture || ''
  });

  useEffect(() => {
    const validInput = values.name.length > 0 && (
      values.picture.length === 0 || 
      values.picture.startsWith('http://') || 
      values.picture.startsWith('https://')
    );;

    let changed = true;
    if (channel) {
      const metaName = channel?.metadata.name || '', metaAbout = channel?.metadata.about || '', metaPic = channel?.metadata.picture || '';
      changed = values.name !== metaName || values.about !== metaAbout || values.picture !== metaPic;
    }

    setValid(validInput && changed);
  }, [values, channel]);

  useEffect(() => {
    if (done) {
      if (channel) {
        onClose?.();
      } else {
        nav(`/channels/${done}`);
      }
    }
  }, [done]);

  const onChanged = (name: string, value: string) => setValues({ ...values, [ name ]: value });

  const save = () => {
    setSaving(true);

    mux.waitRelayBecomesHealthy(1, 3000)
      .then(ok => {
        if (!ok) {
          toast.warn('リレーサーバーに接続されていません');
          setSaving(false);
          return;
        }

        const content: ValidatedValues = { name: values.name };
        if (values.about.length > 0) {
          content.about = values.about;
        }

        if (values.picture.length > 0) {
          content.picture = values.picture;
        }

        (channel ? buildEventForUpdate(channel, content, metadata) : buildEventForCreation(content))
          .then(event => {
            if (channel && channel.metadata.creator !== event.pubkey) {
              toast.warn('サインイン状態が不正なためチャンネルを更新できません');
              setSaving(false);
              return;
            }

            let acceptedOnce = false;

            mux.publish(event, {
              timeout: 10000,
              onResult: (result) => {
                if (result.received.accepted && !acceptedOnce) {
                  toast.success(channel ? 'チャンネル情報を更新しました' : 'チャンネルを作成しました');
                  acceptedOnce = true;
                  setSaving(false);
                  setDone(event.id);
                }
              },
              onComplete: () => {
                if (!acceptedOnce) {
                  toast.warn(`チャンネル『${values.name}』の${channel ? '更新' : '作成'}に失敗しました`);
                  setSaving(false);
                  return;
                }
              }
            });
          })
          .catch(() => {
            toast.warn(`チャンネル情報の署名に失敗しました`);
            setSaving(false);
          });
      });
  };

  return (
    <form className="ChannelForm" name={channel ? 'newChannel' : `updateChannel`} onSubmit={(e: React.FormEvent) => e.preventDefault()}>
      <div className="Title">
        <h2>{title}</h2>
        <MdClose onClick={() => onClose?.()} />
      </div>
      
      <h3>NAME *</h3>
      <TextArea name="name" placeholder="チャンネルの名前は？" value={values.name} onChange={onChanged} />

      <h3>ABOUT</h3>
      <TextArea name="about" multiline placeholder="何をするところ？"  value={values.about} onChange={onChanged} />

      <h3>PICTURE</h3>
      <TextArea name="picture" placeholder="https://..."  value={values.picture} onChange={onChanged} />

      <div className="Buttons">
        <Link to="/help"><MdHelp /></Link>
        <Button disabled={!valid || saving} onClick={save}>{channel ? 'UPDATE' : 'CREATE'}</Button>
      </div>
    </form>
  )
}