import { CheckIcon } from '../icons/Icons';
import './OrganizeCheckbox.css';

interface OrganizeCheckboxProps {
  state: 'full' | 'partial' | 'empty';
}

const OrganizeCheckbox = ({ state }: OrganizeCheckboxProps) => (
  <span className={`organize-check${state !== 'empty' ? ` ${state}` : ''}`}>
    {state === 'full' && <CheckIcon width={10} height={10} />}
    {state === 'partial' && <span className="organize-partial-dash" />}
  </span>
);

export default OrganizeCheckbox;
