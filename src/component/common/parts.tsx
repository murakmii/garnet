import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

import './parts.scss';

const linkMatcher = /https?:\/\/[\w!\?/\+\-_~=;\.,\*&@#\$%\(\)'\[\]]+/g;
const lineBreakMatcher = /\r?\n/;

export type ComponentType = 'Note' | 'Setting' | 'Max';

export type ComponentProps = {
  id?: string;
  type?: ComponentType;
  children?: ReactNode;
};

export const Component = ({ id, type, children }: ComponentProps) => {
  return <div id={id} className={`Component ${type}`}>{children}</div>
};

export const ExternalLink = ({ to, children, backgroundImage, className }: { to: string, children?: ReactNode, backgroundImage?: string, className?: string }) => {
  const style: { [K: string]: string } = {};
  if (backgroundImage) {
    style.backgroundImage = `url(${backgroundImage})`;
  }

  return <a className={`ExternalLink ${className}`} href={to} target="_blank" rel="noopener noreferrer" style={style}>{children}</a>
};

export const Markdown = ({ md, trust }: { md: string, trust?: boolean }) => {
  const linkRenderer = ({ href, children }: { href?: string, children?: ReactNode }) => {
    if (trust && href && !href.startsWith('http') && !href.startsWith('mailto')) {
      return <Link to={href}>{children}</Link>;
    } else {
      return <ExternalLink to={href || ''}>{children}</ExternalLink>
    }
  };

  return (
    <ReactMarkdown className="Markdown" components={{ a: linkRenderer }}>
      {md}
    </ReactMarkdown>
  )
};

export const DialogBackground = ({ children }: { children: ReactNode }) => {
  return (
    <div className="DialogBackground">
      {children}
    </div>
  );
};

const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

export const Paragraph = ({ className, children }: { className?: string, children: string }) => {
  const match = (children.match(linkMatcher) || [])
  const other = children.split(linkMatcher);
  const result = [];
  const images = [];

  let key = 1;
  for (let i = 0; i < other.length; i++) {
    const lines = other[i].split(lineBreakMatcher);
    for (let j = 0; j < lines.length; j++) {
      result.push(lines[j]);
      if (j != lines.length - 1) {
        result.push(<br key={key++} />);
      }
    }

    if (match[i]) {
      result.push(<a key={key++} href={match[i]} target="_blank" rel="noopener noreferrer">{match[i]}</a>)
      
      const mayBeImageURL = match[i].toLowerCase();
      for (const ext of imageExts) {
        if (mayBeImageURL.endsWith(ext)) {
          images.push(<ExternalLink className="Image" key={key++} to={match[i]} backgroundImage={match[i]} />);
          break;
        }
      }
    }
  }

  return (
    <p className={`Paragraph ${className}`}>
      {result}
      {images.length > 0 && <span className="Images">{images}</span>}
    </p>
  );
}

export const ErrorHeader = ({ children }: { children: ReactNode }) => {
  return <h2 className="ErrorHeader">{children}</h2>
};
