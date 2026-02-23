import { type ReactNode } from 'react';
import './OrganizeStatusView.css';

interface OrganizeStatusViewProps {
  icon: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}

const OrganizeStatusView = ({
  icon,
  title,
  description,
  children,
}: OrganizeStatusViewProps) => (
  <div className="organize-status-view">
    {icon}
    <p className="organize-status-view-title">{title}</p>
    {description && (
      <p className="organize-status-view-description">{description}</p>
    )}
    {children}
  </div>
);

export default OrganizeStatusView;
