export type BadgeType = 'new-feature' | 'update' | 'coming-soon';
export type ColorScheme = 'green' | 'purple' | 'orange';

export interface DiscoverCard {
  id: string;
  badgeType: BadgeType;
  badgeLabel: string;
  date: string;
  title: string;
  description: string;
  iconName: string;
}

export interface DiscoverSubTab {
  id: string;
  label: string;
  iconName: string;
  description: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  colorScheme: ColorScheme;
  targetTab: string;
}

export interface PartnerApp {
  id: string;
  title: string;
  description: string;
  url: string;
  logoPath: string;
}

export interface BlogPost {
  title: string;
  slug: string;
  url: string;
  excerpt: string;
  image: string;
  tags: string[];
  datePublished: string;
  readingTime: string;
  author: string;
}
