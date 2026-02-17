import './Button.css';

interface ButtonProps {
  variant?: 'ghost' | 'primary' | 'danger' | 'icon' | 'tab';
  fullWidth?: boolean;
  compact?: boolean;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
}

const Button = ({
  variant = 'ghost',
  fullWidth = false,
  compact = false,
  active = false,
  disabled = false,
  children,
  onClick,
  title,
  className = '',
}: ButtonProps) => {
  const getBaseClass = (): string => {
    if (variant === 'icon') return 'btn-icon';
    if (variant === 'tab') return 'service-tab-pill';
    return 'btn-ghost';
  };

  const baseClass = getBaseClass();
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : '';
  const widthClass = fullWidth ? 'btn-full' : '';
  const compactClass = compact ? 'btn-compact' : '';
  const activeClass = active ? 'active' : '';

  const combinedClassName = [baseClass, variantClass, widthClass, compactClass, activeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={combinedClassName}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
