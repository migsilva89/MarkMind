import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDownIcon, CheckIcon } from '../icons/Icons';
import './Dropdown.css';

interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const Dropdown = ({ label, options, selectedId, onSelect, placeholder, disabled = false }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.id === selectedId);
  const hasSelection = !!selectedOption;
  const displayLabel = selectedOption?.label ?? placeholder ?? options[0]?.label ?? '';

  const handleToggle = useCallback((): void => {
    if (disabled) return;
    setIsOpen(previousState => !previousState);
  }, [disabled]);

  const handleOptionSelect = useCallback((optionId: string): void => {
    onSelect(optionId);
    setIsOpen(false);
  }, [onSelect]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="dropdown" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <span className="dropdown-label">{label}</span>
      <button
        className={`dropdown-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${!hasSelection ? 'placeholder' : ''}`}
        onClick={handleToggle}
        type="button"
        disabled={disabled}
      >
        <span className="dropdown-trigger-text">{displayLabel}</span>
        <ChevronDownIcon />
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <button
              key={option.id}
              className={`dropdown-option ${option.id === selectedId ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(option.id)}
              type="button"
            >
              <span className="dropdown-option-text">{option.label}</span>
              {option.id === selectedId && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
