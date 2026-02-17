import { type OrganizeMessage } from './types/messaging';
import { debug } from './utils/debug';

chrome.runtime.onMessage.addListener(
  (message: OrganizeMessage, _sender, sendResponse) => {
    debug('[Background] Received message:', message.type);
    sendResponse({ success: true });
    return true;
  }
);

chrome.alarms.onAlarm.addListener((alarm) => {
  debug('[Background] Alarm fired:', alarm.name);
});
