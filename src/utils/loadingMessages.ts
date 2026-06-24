import { LOADING_MESSAGE_TEMPLATES } from '../config/loadingMessages';

// Builds a status message from a template, substituting the real bookmark count
// so the user sees what is actually happening (no fake progress).

const formatBookmarkCount = (bookmarkCount: number): string => {
  const formatted = bookmarkCount.toLocaleString();
  return `${formatted} bookmark${bookmarkCount === 1 ? '' : 's'}`;
};

export const buildLoadingMessage = (index: number, bookmarkCount: number): string => {
  const template = LOADING_MESSAGE_TEMPLATES[index % LOADING_MESSAGE_TEMPLATES.length];
  return template.replace(/\{bookmarks\}/g, formatBookmarkCount(bookmarkCount));
};

export const getNextLoadingMessageIndex = (currentIndex: number): number => {
  return (currentIndex + 1) % LOADING_MESSAGE_TEMPLATES.length;
};
