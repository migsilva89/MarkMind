import { useState, useCallback } from 'react';
import { SettingsIcon, SunIcon, MoonIcon } from '../icons/Icons';
import Button from '../Button/Button';
import TabNavigation from '../TabNavigation/TabNavigation';
import HomeTab from '../tabs/HomeTab';
import OrganizeTab from '../tabs/OrganizeTab';
import DiscoverTab from '../tabs/DiscoverTab';
import BlogTab from '../tabs/BlogTab';
import { ResolvedTheme } from '../../hooks/useTheme';

interface MainContentProps {
  onOpenSettings: () => void;
  theme: ResolvedTheme;
  onToggleTheme: () => void;
}

const MainContent = ({ onOpenSettings, theme, onToggleTheme }: MainContentProps) => {
  const [activeTab, setActiveTab] = useState('home');

  const handleTabChange = useCallback((tabId: string): void => {
    setActiveTab(tabId);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab onTabChange={handleTabChange} onOpenSettings={onOpenSettings} />;
      case 'organize':
        return <OrganizeTab />;
      case 'discover':
        return <DiscoverTab />;
      case 'blog':
        return <BlogTab />;
      default:
        return <HomeTab onTabChange={handleTabChange} onOpenSettings={onOpenSettings} />;
    }
  };

  return (
    <>
      <header className="main-header">
        <div className="main-header-left">
          <img
            src="/assets/icons/icon48.png"
            alt="MarkMind"
            className="main-header-logo"
          />
          <h1 className="main-header-title">MarkMind</h1>
        </div>
        <div className="main-header-right">
          <Button
            variant="icon"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </Button>
          <Button variant="icon" onClick={onOpenSettings} title="Settings">
            <SettingsIcon />
          </Button>
        </div>
      </header>

      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="main-content">
        {renderActiveTab()}
      </main>
    </>
  );
};

export default MainContent;
