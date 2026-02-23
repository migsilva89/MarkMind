import { useCallback } from 'react';
import { HomeIcon, FolderIcon, CompassIcon, BookOpenIcon } from '../icons/Icons';
import Button from '../Button/Button';
import './TabNavigation.css';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ width?: number; height?: number }>;
}

const TAB_CONFIG: TabConfig[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'organize', label: 'Organize', icon: FolderIcon },
  { id: 'discover', label: 'Discover', icon: CompassIcon },
  { id: 'blog', label: 'Blog', icon: BookOpenIcon },
];

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const handleTabClick = useCallback(
    (tabId: string) => () => {
      onTabChange(tabId);
    },
    [onTabChange]
  );

  return (
    <nav className="tab-navigation">
      {TAB_CONFIG.map((tabConfig) => {
        const TabIcon = tabConfig.icon;
        return (
          <Button
            key={tabConfig.id}
            variant="ghost"
            active={activeTab === tabConfig.id}
            onClick={handleTabClick(tabConfig.id)}
            className="tab-navigation-button"
          >
            <TabIcon width={12} height={12} />
            {tabConfig.label}
          </Button>
        );
      })}
    </nav>
  );
};

export default TabNavigation;
