interface IconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const GitHubIcon = ({ className = 'github-icon' }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export const StarIcon = ({ className = 'star-icon', width = 14, height = 14 }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" width={width} height={height}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const ArrowLeftIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

export const ArrowRightIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5l7 7-7 7"
    />
  </svg>
);

export const CloseIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const KeyIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  </svg>
);

export const ShieldIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

export const WarningIcon = ({ width = 12, height = 12 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

export const SettingsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export const SpinnerIcon = ({ className = 'spinner', width = 14, height = 14 }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    width={width}
    height={height}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      strokeWidth="2"
      strokeDasharray="32"
      strokeLinecap="round"
    />
  </svg>
);

export const PlusIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4v16m8-8H4"
    />
  </svg>
);

export const CheckIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 13l4 4L19 7"
    />
  </svg>
);

export const XIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const GlobeIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    />
  </svg>
);

export const HomeIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

export const SparklesIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

export const CompassIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
    />
  </svg>
);

export const DocumentIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

export const BugIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 12v4m0-4a4 4 0 00-4 4v1a4 4 0 008 0v-1a4 4 0 00-4-4zm0 0V8m0 0a2 2 0 10-.001-4.001A2 2 0 0012 8zm-4 4H3m18 0h-5m-8 4H3m18 0h-5M9 8l-2-2m8 2l2-2"
    />
  </svg>
);

export const RefreshIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

export const LightbulbIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

export const WrenchIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
    />
  </svg>
);

export const MegaphoneIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
    />
  </svg>
);

export const BookOpenIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

export const FolderIcon = ({ width = 14, height = 14 }: IconProps) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={width}
    height={height}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);
