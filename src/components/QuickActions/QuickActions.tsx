import { useCallback } from 'react';
import {
  FolderIcon,
  CompassIcon,
  BookOpenIcon,
  SettingsIcon,
} from '../icons/Icons';
import { QUICK_ACTIONS } from '../../config/discoverContent';
import { type QuickActionItem } from '../../types/discover';
import './QuickActions.css';

const ACTION_ICONS: Record<string, React.ComponentType<{ width?: number; height?: number }>> = {
  folder: FolderIcon,
  compass: CompassIcon,
  bookOpen: BookOpenIcon,
  settings: SettingsIcon,
};

interface QuickActionsProps {
  onTabChange: (tabId: string) => void;
  onOpenSettings: () => void;
}

const QuickActions = ({ onTabChange, onOpenSettings }: QuickActionsProps) => {
  const handleCardClick = useCallback(
    (action: QuickActionItem) => () => {
      if (action.externalUrl) {
        chrome.tabs.create({ url: action.externalUrl });
      } else if (action.targetTab === 'settings') {
        onOpenSettings();
      } else {
        onTabChange(action.targetTab);
      }
    },
    [onTabChange, onOpenSettings]
  );

  return (
    <div className="quick-actions">
      <h2 className="quick-actions-title">Quick Actions</h2>
      <div className="quick-actions-grid">
        {QUICK_ACTIONS.map((action) => {
          const ActionIcon = ACTION_ICONS[action.iconName];
          return (
            <button
              key={action.id}
              className="quick-actions-card"
              onClick={handleCardClick(action)}
            >
              <div className={`quick-actions-card-icon quick-actions-card-icon-${action.colorScheme}`}>
                {ActionIcon && <ActionIcon width={14} height={14} />}
              </div>
              <h3 className="quick-actions-card-title">{action.title}</h3>
              <p className="quick-actions-card-description">{action.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
