import { PARTNER_APPS } from '../../../config/discoverContent';
import PartnerCard from './PartnerCard';

const AppsSection = () => (
  <div className="discover-section">
    {PARTNER_APPS.map((partner) => (
      <PartnerCard key={partner.id} partner={partner} />
    ))}
  </div>
);

export default AppsSection;
