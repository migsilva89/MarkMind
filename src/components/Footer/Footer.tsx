import { useCallback } from 'react';
import { GitHubIcon, BugIcon } from '../icons/Icons';
import './Footer.css';

const GITHUB_REPO_URL = 'https://github.com/migsilva89/MarkMind';
const GITHUB_ISSUES_URL = 'https://github.com/migsilva89/MarkMind/issues';

const Footer = () => {
  const handleOpenLink = useCallback((url: string) => () => {
    chrome.tabs.create({ url });
  }, []);

  return (
    <footer className="footer">
      <span className="footer-version">
        MarkMind v{chrome.runtime.getManifest().version}
      </span>
      <div className="footer-links">
        <button
          className="footer-icon-button"
          onClick={handleOpenLink(GITHUB_REPO_URL)}
          title="GitHub"
        >
          <GitHubIcon />
        </button>
        <button
          className="footer-icon-button"
          onClick={handleOpenLink(GITHUB_ISSUES_URL)}
          title="Report a Bug"
        >
          <BugIcon width={12} height={12} />
        </button>
      </div>
    </footer>
  );
};

export default Footer;
