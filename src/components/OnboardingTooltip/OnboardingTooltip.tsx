import Button from '../Button/Button';
import { XIcon } from '../icons/Icons';
import './OnboardingTooltip.css';

interface OnboardingTooltipProps {
  content: string;
  onDismiss: () => void;
}

const OnboardingTooltip = ({ content, onDismiss }: OnboardingTooltipProps) => {
  return (
    <div className="onboarding-tooltip">
      <div className="onboarding-tooltip-content">
        <p className="onboarding-tooltip-text">{content}</p>
        <Button
          variant="icon"
          className="onboarding-tooltip-dismiss"
          onClick={onDismiss}
          title="Dismiss"
        >
          <XIcon width={12} height={12} />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingTooltip;
