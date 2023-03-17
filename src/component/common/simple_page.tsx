import { ReactNode, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useOutlet } from 'react-router';
import { Link } from 'react-router-dom';

import { RouteEntry, helpRouteEntries, settingsRouteEntries, allRouteEntries } from '../../const';
import { useApp } from '../../state/app';
import { PageHeader } from './page_header';
import './simple_page.scss';

const SimpleMenu = ({ title, entries }: { title: string, entries: RouteEntry[] }) => {
  const path = useLocation().pathname;

  return (
    <div id="SimpleMenu">
      <h2>{title}</h2>

      <ul>
        {entries.map(entry => 
          <li key={entry.key}>
            <Link className={(entry.link === path || (entry.matchURL?.includes(path))) ? 'Selected' : ''} to={entry.link}>
              {entry.name}
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

export const HelpMenu = () => <SimpleMenu title="HELP" entries={helpRouteEntries} />
export const SettingsMenu = () => <SimpleMenu title="SETTINGS" entries={settingsRouteEntries} />

export const SimplePage = ({ children, requireSignIn }: { children?: ReactNode, requireSignIn?: boolean }) => {
  const { app } = useApp();
  const path = useLocation().pathname;
  const title = allRouteEntries.find(entry => entry.link === path || entry.matchURL?.includes(path))?.name || '';
  const nav = useNavigate();

  useEffect(() => {
    if (requireSignIn && !app.pubkey) {
      nav('/');
    }
  }, [requireSignIn, app.pubkey]);

  return (
    <div id="SimplePage">
      <PageHeader>
        <h2>{title}</h2>
      </PageHeader>

      <div className="Page">
        <div className="PageContent">
          {useOutlet() || children}
        </div>
      </div>
    </div>
  );
};