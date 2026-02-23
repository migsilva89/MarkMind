import { DEV_TOOLS_CARDS } from '../../../config/discoverContent';
import DiscoverCard from './DiscoverCard';

const DevToolsSection = () => (
  <div className="discover-section">
    {DEV_TOOLS_CARDS.map((card) => (
      <DiscoverCard key={card.id} card={card} />
    ))}
  </div>
);

export default DevToolsSection;
