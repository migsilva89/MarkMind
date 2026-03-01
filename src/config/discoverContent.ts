import {
  type DiscoverCard,
  type DiscoverSubTab,
  type QuickActionItem,
  type PartnerApp,
} from '../types/discover';

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
    id: 'apps',
    label: 'Apps',
    iconName: 'wrench',
    description: 'Hand-picked tools from our circle of friends. No ads, just good stuff.',
  },
];

export const WHATS_NEW_CARDS: DiscoverCard[] = [
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
    id: 'smart-folder-matching',
    badgeType: 'update',
    badgeLabel: 'Update',
    date: 'Feb 2026',
    title: 'Smarter folder matching',
    description:
      'Bookmarks now land in the right folder more often. AI understands your entire folder structure to find the best fit.',
    iconName: 'sparkles',
  },
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
    id: 'discover-partner-apps',
    badgeType: 'new-feature',
    badgeLabel: 'New Feature',
    date: 'Mar 2026',
    title: 'Discover Apps from friends',
    description:
      'Explore hand-picked tools from our circle of friends. No ads, just good stuff we actually use.',
    iconName: 'globe',
  },
  {
    id: 'settings-redesign',
    badgeType: 'update',
    badgeLabel: 'Update',
    date: 'Feb 2026',
    title: 'Redesigned Settings page',
    description:
      'Cleaner settings with dropdowns, model selector, and inline validation. Easier to set up than ever.',
    iconName: 'settings',
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
  {
    id: 'tip-review-suggestions',
    badgeType: 'update',
    badgeLabel: 'Tip',
    date: '',
    title: 'Always review before accepting',
    description:
      'AI suggestions are smart but not perfect. A quick review catches edge cases and keeps your folders exactly how you like them.',
    iconName: 'globe',
  },
  {
    id: 'tip-try-providers',
    badgeType: 'update',
    badgeLabel: 'Tip',
    date: '',
    title: 'Experiment with different AI providers',
    description:
      'Each provider has its strengths. Try Gemini, OpenAI, or Anthropic to see which one best understands your bookmark style.',
    iconName: 'settings',
  },
  {
    id: 'tip-name-folders-clearly',
    badgeType: 'update',
    badgeLabel: 'Tip',
    date: '',
    title: 'Name folders with clear intent',
    description:
      'Folders like "Design Resources" work better than "Stuff". Descriptive names help AI match bookmarks to the right place.',
    iconName: 'lightbulb',
  },
  {
    id: 'tip-bookmark-as-you-go',
    badgeType: 'update',
    badgeLabel: 'Tip',
    date: '',
    title: 'Bookmark now, organize later',
    description:
      'Save anything interesting without worrying about the right folder. Let MarkMind sort it out when you are ready.',
    iconName: 'sparkles',
  },
];

export const PARTNER_APPS: PartnerApp[] = [
  {
    id: 'serploom',
    title: 'Serploom',
    description: 'AI-powered SEO tool to find striking distance keywords.',
    url: 'https://serploom.com',
    logoPath: '/assets/partners/serploom.png',
  },
  {
    id: 'flowmate',
    title: 'FlowMate',
    description: 'AI email assistant unifying Gmail, Outlook, Slack, Telegram.',
    url: 'https://flowmate.click',
    logoPath: '/assets/partners/flowmate.png',
  },
  {
    id: 'criarcomia',
    title: 'Criar Com IA',
    description: 'Portuguese AI platform for creating and transforming images.',
    url: 'https://criarcomia.pt',
    logoPath: '/assets/partners/criarcomia.png',
  },
  {
    id: 'bookmarkjar',
    title: 'BookmarkJar',
    description: 'AI-powered bookmark manager with smart tagging and semantic search.',
    url: 'https://bookmarkjar.com',
    logoPath: '/assets/partners/bookmarkjar.png',
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
