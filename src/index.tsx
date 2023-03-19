import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './index.css';
import { App, ErrorPage } from './component/app';
import { ChannelView } from './component/chat/channel_view';
import { ChannelBrowser } from './component/chat/channel_browser';
import { BasicSetting } from './component/settings/basic';
import { RelaySetting } from './component/settings/relay';
import { SimplePage } from './component/common/simple_page';
import { welcomeMessage, publicChatHelp, signInHelp, garnetHelp } from './const';
import { Component, Markdown } from './component/common/parts';
import { ProfilePage } from './component/user/profile_page';
import { useApp } from './state/app';
import { MessageTimeline } from './component/home/message_timeline';

const Top = () => {
  return useApp().app.pubkey ? <MessageTimeline /> : (
    <SimplePage>
      <Component type="Note"><Markdown trust md={welcomeMessage} /></Component>
    </SimplePage>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <Top />
      },
      {
        path: 'channels',
        element: <ChannelBrowser />
      },
      {
        path: 'channels/:channelID',
        element: <ChannelView />,
      },
      {
        path: 'users/:pubkey',
        element: <ProfilePage />
      },
      {
        path: 'help',
        element: <SimplePage />,
        children: [
          {
            path: '',
            element: <Component type="Note"><Markdown trust md={publicChatHelp} /></Component>
          },
          {
            path: 'chat',
            element: <Component type="Note"><Markdown trust md={publicChatHelp} /></Component>
          },
          {
            path: 'signin',
            element: <Component type="Note"><Markdown trust md={signInHelp} /></Component>
          },
          {
            path: 'garnet',
            element: <Component type="Note"><Markdown trust md={garnetHelp} /></Component>
          }
        ]
      },
      {
        path: 'settings',
        element: <SimplePage requireSignIn />,
        children: [
          {
            path: '',
            element: <Component type="Setting"><BasicSetting /></Component>
          },
          {
            path: 'basic',
            element: <Component type="Setting"><BasicSetting /></Component>
          },
          {
            path: 'relay',
            element: <Component type="Setting"><RelaySetting /></Component>
          }
        ],
      },
      {
        path: '*',
        element: <ErrorPage />
      }
    ],
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
