export const LOADING_MESSAGES: string[] = [
  'MarkMind is helping you...',
  'Finding the perfect folder...',
  'Almost there!',
  "You're on the right path!",
  'Organizing your world...',
  'AI is thinking...',
  'Just a moment...',
  'Analyzing your page...',
  'Smart sorting in progress...',
];

export const getNextLoadingMessage = (currentIndex: number): { message: string; nextIndex: number } => {
  const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
  return {
    message: LOADING_MESSAGES[nextIndex],
    nextIndex,
  };
};
