import { useState, useCallback } from 'react';
import { MegaphoneIcon, LightbulbIcon } from '../icons/Icons'; // TODO: Re-add WrenchIcon when Apps is re-enabled
import Button from '../Button/Button';
import { DISCOVER_SUB_TABS } from '../../config/discoverContent';
import WhatsNewSection from './discover/WhatsNewSection';
import ProTipsSection from './discover/ProTipsSection';
// TODO: Re-enable AppsSection post-launch
// import AppsSection from './discover/AppsSection';
import './DiscoverTab.css';

const SUB_TAB_ICONS: Record<string, React.ComponentType<{ width?: number; height?: number }>> = {
  megaphone: MegaphoneIcon,
  lightbulb: LightbulbIcon,
  // TODO: Re-enable when Apps sub-tab is re-enabled post-launch
  // wrench: WrenchIcon,
};

const DiscoverTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('whats-new');

  const handleSubTabClick = useCallback(
    (subTabId: string) => () => {
      setActiveSubTab(subTabId);
    },
    []
  );

  const activeSubTabConfig = DISCOVER_SUB_TABS.find((subTab) => subTab.id === activeSubTab);

  const renderActiveSection = () => {
    switch (activeSubTab) {
      case 'whats-new':
        return <WhatsNewSection />;
      case 'pro-tips':
        return <ProTipsSection />;
      // TODO: Re-enable post-launch
      // case 'apps':
      //   return <AppsSection />;
      default:
        return <WhatsNewSection />;
    }
  };

  return (
    <div className="discover-tab">
      <nav className="discover-sub-tabs">
        {DISCOVER_SUB_TABS.map((subTab) => {
          const SubTabIcon = SUB_TAB_ICONS[subTab.iconName];
          return (
            <Button
              key={subTab.id}
              variant="ghost"
              active={activeSubTab === subTab.id}
              onClick={handleSubTabClick(subTab.id)}
              className="discover-sub-tab-button"
            >
              {SubTabIcon && <SubTabIcon width={12} height={12} />}
              {subTab.label}
            </Button>
          );
        })}
      </nav>

      <p className="discover-description">
        {activeSubTabConfig?.description}
      </p>

      {renderActiveSection()}
    </div>
  );
};

export default DiscoverTab;
