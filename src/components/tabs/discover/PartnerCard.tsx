import { useCallback } from 'react';
import { ExternalLinkIcon } from '../../icons/Icons';
import { type PartnerApp } from '../../../types/discover';
import './PartnerCard.css';

interface PartnerCardProps {
  partner: PartnerApp;
}

const PartnerCard = ({ partner }: PartnerCardProps) => {
  const handleClick = useCallback(() => {
    chrome.tabs.create({ url: partner.url });
  }, [partner.url]);

  return (
    <button className="partner-card" onClick={handleClick} title={`Visit ${partner.title}`}>
      <div className="partner-card-logo">
        <img src={partner.logoPath} alt={`${partner.title} logo`} width={36} height={36} />
      </div>
      <div className="partner-card-content">
        <div className="partner-card-meta">
          <span className="partner-card-badge">Friend</span>
          <ExternalLinkIcon width={10} height={10} />
        </div>
        <h3 className="partner-card-title">{partner.title}</h3>
        <p className="partner-card-description">{partner.description}</p>
      </div>
    </button>
  );
};

export default PartnerCard;
