import { WHATS_NEW_CARDS } from '../../../config/discoverContent';
import DiscoverCard from './DiscoverCard';

const WhatsNewSection = () => (
  <div className="discover-section">
    {WHATS_NEW_CARDS.map((card) => (
      <DiscoverCard key={card.id} card={card} />
    ))}
  </div>
);

export default WhatsNewSection;
