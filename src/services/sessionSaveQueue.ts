// Writes the organize session to storage. Selection toggles are batched with a
// short debounce; state changes (scanning, organizing, ...) are written at once.
export interface SessionSaveQueue<T> {
  schedule: (value: T) => void;
  saveNow: (value: T) => Promise<void>;
  cancel: () => void;
}

export const createSessionSaveQueue = <T>(
  save: (value: T) => Promise<void>,
  delayMs: number
): SessionSaveQueue<T> => {
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;

  const cancel = (): void => {
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
  };

  const schedule = (value: T): void => {
    cancel();
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      save(value).catch(error => {
        console.error('Error saving session:', error);
      });
    }, delayMs);
  };

  // A pending selection write holds an older snapshot — drop it so it can't
  // land after (and overwrite) this newer state.
  const saveNow = (value: T): Promise<void> => {
    cancel();
    return save(value);
  };

  return { schedule, saveNow, cancel };
};
