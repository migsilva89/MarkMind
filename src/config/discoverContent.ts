import { type DiscoverCard, type DiscoverSubTab, type QuickActionItem } from '../types/discover';

export const DISCOVER_SUB_TABS: DiscoverSubTab[] = [
  {
    id: 'whats-new',
    label: "What's New",
    iconName: 'megaphone',
    description: "Fresh from the workshop — here's what we've been building for you.",
  },
  {
    id: 'pro-tips',
    label: 'Pro Tips',
    iconName: 'lightbulb',
    description: 'Small habits, big impact. Quick wins to keep your bookmarks stress-free.',
  },
  {
    id: 'dev-tools',
    label: 'Dev Tools',
    iconName: 'wrench',
    description: 'Hand-picked tools from our circle of friends. No ads, just good stuff.',
  },
];

export const WHATS_NEW_CARDS: DiscoverCard[] = [
  {
    id: 'bulk-organize',
    badgeType: 'new-feature',
    badgeLabel: 'New Feature',
    date: 'Feb 2026',
    title: 'Bulk Organize is here!',
    description:
      'Select multiple bookmarks and let AI sort them into the perfect folders automatically.',
    iconName: 'sparkles',
  },
  {
    id: 'multi-provider',
    badgeType: 'update',
    badgeLabel: 'Update',
    date: 'Feb 2026',
    title: 'Multi-provider AI support',
    description:
      'Choose between Gemini, OpenAI, Anthropic, or OpenRouter — use the AI you trust most.',
    iconName: 'settings',
  },
  {
    id: 'insights-tab',
    badgeType: 'coming-soon',
    badgeLabel: 'Coming Soon',
    date: 'Soon',
    title: 'Insights & health score',
    description:
      'See how organized your bookmarks are, find forgotten gems, and clean up clutter.',
    iconName: 'globe',
  },
];

export const PRO_TIPS_CARDS: DiscoverCard[] = [
  {
    id: 'tip-organize-regularly',
    badgeType: 'update',
    badgeLabel: 'Tip',
    date: '',
    title: 'Organize regularly, not all at once',
    description:
      'Run Bulk Organize weekly on new bookmarks. Small batches get better AI accuracy than dumping hundreds at once.',
    iconName: 'lightbulb',
  },
  {
    id: 'tip-folder-structure',
    badgeType: 'update',
    badgeLabel: 'Tip',
    date: '',
    title: 'Let AI learn your folder structure',
    description:
      'The more organized folders you have, the smarter AI suggestions become. Start with a few good folders.',
    iconName: 'sparkles',
  },
];

export const DEV_TOOLS_CARDS: DiscoverCard[] = [
  {
    id: 'dev-github',
    badgeType: 'new-feature',
    badgeLabel: 'Open Source',
    date: '',
    title: 'Contribute on GitHub',
    description:
      'MarkMind is open source! Check out the repo, report bugs, or submit pull requests.',
    iconName: 'globe',
  },
];

export const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'organize',
    title: 'Organize',
    description: 'Select bookmarks and let AI sort them into the perfect folders automatically.',
    iconName: 'folder',
    colorScheme: 'green',
    targetTab: 'organize',
  },
  {
    id: 'discover',
    title: 'Discover',
    description: 'Explore new features, pro tips, and hand-picked extensions from friends.',
    iconName: 'compass',
    colorScheme: 'purple',
    targetTab: 'discover',
  },
  {
    id: 'blog',
    title: 'Blog',
    description: 'Read articles, tips, and stories about organizing your digital life.',
    iconName: 'bookOpen',
    colorScheme: 'purple',
    targetTab: 'blog',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Set up your API key, choose your AI provider, and manage your preferences.',
    iconName: 'settings',
    colorScheme: 'orange',
    targetTab: 'settings',
  },
];
