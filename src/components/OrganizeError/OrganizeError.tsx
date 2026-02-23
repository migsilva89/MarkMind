import { WarningIcon, RefreshIcon } from '../icons/Icons';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';
import Button from '../Button/Button';

interface OrganizeErrorProps {
  errorMessage: string | null;
  onReset: () => void;
}

const OrganizeError = ({ errorMessage, onReset }: OrganizeErrorProps) => (
  <OrganizeStatusView
    icon={<WarningIcon width={20} height={20} />}
    title="Something went wrong"
    description={errorMessage || 'An unexpected error occurred'}
  >
    <Button onClick={onReset} fullWidth>
      <RefreshIcon />
      Try Again
    </Button>
  </OrganizeStatusView>
);

export default OrganizeError;
