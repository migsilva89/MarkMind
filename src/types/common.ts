export type StatusType = 'success' | 'error' | 'loading' | 'default' | null;

export interface StatusMessage {
  message: string;
  type: StatusType;
}
