import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { Filter } from 'nostr-mux';
import 'react-toastify/dist/ReactToastify.css';

import './app.scss';
import { ChannelList } from './chat/channel_list';
import { AppProvider, useApp } from '../state/app';
import { useChannels } from '../state/channels';
import { usePinChannelLastMessageTimestamps } from '../state/pin_channel_last_message_timestamps';
import { PageHeader } from './common/page_header';
import { HelpMenu, SettingsMenu } from './common/simple_page';
import { ErrorHeader } from './common/parts';

const Sidebar = () => {
  const [filters] = useState<[Filter, ...Filter[]]>([
    {
      kinds: [40],
      until: Math.floor(Date.now() / 1000),
      limit: 100,
    },
    {
      kinds: [41],
      until: Math.floor(Date.now() / 1000),
      limit: 100,
    }
  ]);

  const path = useLocation().pathname;
  const help = path === '/help' || path.startsWith('/help/');
  const settings = path === '/settings' || path.startsWith('/settings/');

  // サイドバーの内容に依らずチャンネル一覧と未読状態は維持し続ける
  const channels = useChannels({ pubkey: useApp().app.pubkey, subID: 'all_channels', filters });
  const timestamps = usePinChannelLastMessageTimestamps();

  return (
    <div id="Sidebar">
      <h1>
        <Link to="/">GARNET</Link>
      </h1>

      <div className="Content">
        {help ? (
          <HelpMenu />
        ) : (
          settings ? (
            <SettingsMenu />
          ) : (
            <ChannelList channels={channels} timestamps={timestamps} /> 
          )
        )}
      </div>
    </div>
  )
};

export const ErrorPage = () => {
  return (
    <div id="Error">
      <PageHeader><h2>Oops!</h2></PageHeader>
      
      <div className="Page">
        <ErrorHeader>Page not found</ErrorHeader>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <AppProvider>
      <ToastContainer
          position="top-right"
          autoClose={5000}
          pauseOnHover
          pauseOnFocusLoss
          hideProgressBar
          theme="dark" />

      <div id="App">
        <Sidebar />

        <div id="Main">
          <Outlet />
        </div>
      </div>
    </AppProvider>
  );
}
