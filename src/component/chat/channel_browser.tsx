import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, utils } from 'nostr-mux';
import { BsFillPlusSquareFill } from 'react-icons/bs';

import './channel_browser.scss';
import { PageHeader } from '../common/page_header';
import { Button, TextArea } from '../common/form';
import { useApp } from '../../state/app';
import { useChannels } from '../../state/channels';
import { ChannelForm } from '../common/channel_form';
import { PageHeaderClickableIcon } from '../common/page_header';
import { DialogBackground } from '../common/parts';

type SearchFormValues = {
  channelID: string;
  owner: string;
};

export const ChannelBrowser = () => {
  const { app } = useApp();
  const [filters, setFilters] = useState<[Filter, ...Filter[]] | undefined>(undefined);
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchForm, setSearchForm] = useState<SearchFormValues>({ channelID: '', owner: '' });

  const channels = Object.values(useChannels({ pubkey: app.pubkey, subID: 'search_channels', filters }).list)
    .sort((a, b) => b.createdAt - a.createdAt);

  const onChange = (name: string, value: string) => {
    setSearchForm({ ...searchForm, [name]: value });
  };

  // 「SEARCH」ボタン押下時の処理。
  // フォームの入力内容に応じたフィルタを生成しuseChannelsの引数となるようにする。
  // これによりuseChannelsによるチャンネル一覧の取得が開始される。
  const doSearch = () => {
    const filters: [Filter, ...Filter[]] = [{ kinds: [40] }, { kinds: [41] }];
    const specifyID = searchForm.channelID.length > 0

    if (specifyID) {
      filters[0].ids = [searchForm.channelID];
      filters[1]['#e'] = [searchForm.channelID];
    }

    if (searchForm.owner.length > 0) {
      let pubkey: string | undefined = searchForm.owner;
      if (pubkey.startsWith('npub1')) {
        pubkey = utils.decodeBech32ID(pubkey)?.hexID;
      }

      if (pubkey) {
        for (const f of filters) {
          f.authors = [pubkey];
        }
      }
    }

    const now = Math.floor(Date.now() / 1000);
    if (specifyID) {
      filters[1].until = now
      filters[1].limit = 100;
    } else {
      for (const f of filters) {
        f.until = now;
        f.limit = 100;
      }
    }

    setFilters(filters);
  };

  return (
    <div id="ChannelBrowser">
      <PageHeader>
        <PageHeaderClickableIcon hide={!app.pubkey || showNewForm} onClick={() => setShowNewForm(true)}>
          <BsFillPlusSquareFill />
        </PageHeaderClickableIcon>
        
        <h2>BROWSE CHANNEL</h2>
      </PageHeader>

      <div className="Page">

        <form name="search" onSubmit={(e) => e.preventDefault()}>
          <h3>CHANNEL ID</h3>
          <TextArea name="channelID" placeholder="探したいチャンネルのIDは？" value={searchForm.channelID} onChange={onChange} />
          <h3>OWNER</h3>
          <TextArea name="owner" placeholder="誰が作ったチャンネル？(npub...)" value={searchForm.owner} onChange={onChange} />

          <div className="Buttons">
            <Button onClick={doSearch}>SEARCH</Button>
          </div>
        </form>

        {filters && <h2 className="SearchResult"><b>{channels.length}</b> CHANNELS FOUND</h2>}
        {channels.map(ch => <Link className="ChannelLink" key={ch.metadata.id} to={`/channels/${ch.metadata.id}`}>{ch.metadata.name}</Link>)}
      
        {showNewForm && (
          <DialogBackground>
            <ChannelForm title={"NEW CHANNEL"} onClose={() => setShowNewForm(false)} />
          </DialogBackground>
        )}
      </div>
    </div>
  )
};
