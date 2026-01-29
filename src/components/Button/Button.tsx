import './Button.css';

interface ButtonProps {
  variant?: 'ghost' | 'primary' | 'danger' | 'icon';
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
}

const Button = ({
  variant = 'ghost',
  fullWidth = false,
  children,
  onClick,
  title,
  className = '',
}: ButtonProps) => {
  const baseClass = variant === 'icon' ? 'btn-icon' : 'btn-ghost';
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : '';
  const widthClass = fullWidth ? 'btn-full' : '';

  const combinedClassName = [baseClass, variantClass, widthClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={combinedClassName}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
};

export default Button;
