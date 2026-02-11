import { type PageMetadata } from '../types/pages';

export const getCurrentPageData = async (): Promise<PageMetadata | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found');

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const getMeta = (name: string): string | null => {
          const element = document.querySelector(
            `meta[name="${name}"], meta[property="${name}"]`
          );
          return element?.getAttribute('content') || null;
        };

        const getMainH1 = (): string | null => {
          const mainSelectors = [
            'main h1',
            'article h1',
            '[role="main"] h1',
            '.content h1',
            '.post h1',
            '.entry h1',
          ];

          for (const selector of mainSelectors) {
            const h1 = document.querySelector(selector);
            if (h1?.textContent) {
              return h1.textContent.trim().slice(0, 200);
            }
          }

          const allH1s = document.querySelectorAll('h1');
          for (const h1 of allH1s) {
            const parent = h1.closest('[class*="modal"], [class*="popup"], [class*="dialog"], [role="dialog"]');
            if (!parent && h1.textContent) {
              return h1.textContent.trim().slice(0, 200);
            }
          }

          return null;
        };

        return {
          url: location.href,
          title: document.title,
          favIconUrl:
            document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href || null,
          description: getMeta('description') || getMeta('og:description'),
          keywords: getMeta('keywords'),
          h1: getMainH1(),
        };
      },
    });
    return result as PageMetadata;
  } catch (error) {
    console.error('Failed to execute script on page, using fallback:', error);
    return {
      url: tab.url || '',
      title: tab.title || '',
      favIconUrl: tab.favIconUrl,
    };
  }
};
