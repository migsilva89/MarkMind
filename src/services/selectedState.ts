/**
 * Synchronous in-memory state for the currently selected AI service and model.
 *
 * Chrome storage writes are async — when the user picks a new model in the
 * Dropdown (fire-and-forget onSelect), the storage write may not finish before
 * the user navigates back and clicks "Organize this page".  Reading from
 * storage at that point returns the OLD value.
 *
 * This module keeps a synchronous mirror that is written to instantly (plain
 * JS assignment) and read from instantly — zero async gap.  Chrome storage
 * is still written to in parallel for persistence across popup sessions.
 *
 * On popup open, call `initSelectedState()` once to seed from Chrome storage.
 */

import {
  SELECTED_SERVICE_STORAGE_KEY,
  SELECTED_MODEL_STORAGE_KEY,
} from '../config/services';

let currentServiceId = '';
let currentModelId = '';

export const getSelectedServiceId = (): string => currentServiceId;
export const getSelectedModelId = (): string => currentModelId;

export const setSelectedServiceId = (id: string): void => {
  currentServiceId = id;
};

export const setSelectedModelId = (id: string): void => {
  currentModelId = id;
};

export const initSelectedState = async (): Promise<void> => {
  const result = await chrome.storage.local.get([
    SELECTED_SERVICE_STORAGE_KEY,
    SELECTED_MODEL_STORAGE_KEY,
  ]);

  currentServiceId = result[SELECTED_SERVICE_STORAGE_KEY] || '';
  currentModelId = result[SELECTED_MODEL_STORAGE_KEY] || '';
};
