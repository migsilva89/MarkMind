import { PRO_TIPS_CARDS } from '../../../config/discoverContent';
import DiscoverCard from './DiscoverCard';

const ProTipsSection = () => (
  <div className="discover-section">
    {PRO_TIPS_CARDS.map((card) => (
      <DiscoverCard key={card.id} card={card} />
    ))}
  </div>
);

export default ProTipsSection;
