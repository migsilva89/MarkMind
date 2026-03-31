import { useCallback } from 'react';
import { HomeIcon, FolderIcon, CompassIcon, BookOpenIcon, ExternalLinkIcon } from '../icons/Icons';
import Button from '../Button/Button';
import OnboardingTooltip from '../OnboardingTooltip/OnboardingTooltip';
import { MARKMIND_BLOG_URL } from '../../config/discoverContent';
import './TabNavigation.css';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ width?: number; height?: number }>;
  isExternal?: boolean;
  url?: string;
}

const TAB_CONFIG: TabConfig[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'organize', label: 'Organize', icon: FolderIcon },
  { id: 'discover', label: 'Discover', icon: CompassIcon },
  { id: 'blog', label: 'Blog', icon: BookOpenIcon, isExternal: true, url: MARKMIND_BLOG_URL },
];

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showOrganizeTooltip?: boolean;
  onDismissOrganizeTooltip?: () => void;
}

const TabNavigation = ({
  activeTab,
  onTabChange,
  showOrganizeTooltip = false,
  onDismissOrganizeTooltip,
}: TabNavigationProps) => {
  const handleTabClick = useCallback(
    (tabConfig: TabConfig) => () => {
      if (tabConfig.isExternal && tabConfig.url) {
        chrome.tabs.create({ url: tabConfig.url });
      } else {
        onTabChange(tabConfig.id);
      }
    },
    [onTabChange]
  );

  return (
    <div className="tab-navigation-wrapper">
      <nav className="tab-navigation">
        {TAB_CONFIG.map((tabConfig) => {
          const TabIcon = tabConfig.icon;
          return (
            <Button
              key={tabConfig.id}
              variant="ghost"
              active={!tabConfig.isExternal && activeTab === tabConfig.id}
              onClick={handleTabClick(tabConfig)}
              className="tab-navigation-button"
            >
              <TabIcon width={12} height={12} />
              {tabConfig.label}
              {tabConfig.isExternal && <ExternalLinkIcon width={8} height={8} />}
            </Button>
          );
        })}
      </nav>
      {showOrganizeTooltip && onDismissOrganizeTooltip && (
        <div className="tab-navigation-tooltip">
          <OnboardingTooltip
            content="Got messy bookmarks? This is where the magic happens."
            onDismiss={onDismissOrganizeTooltip}
          />
        </div>
      )}
    </div>
  );
};

export default TabNavigation;
