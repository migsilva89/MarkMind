export interface ModelOption {
  id: string;
  name: string;
}

export interface ServiceConfig {
  id: string;
  name: string;
  label: string;
  storageKey: string;
  placeholder: string;
  helpLink: string;
  helpLinkText: string;
  freeTierNote?: string;
  validateKey: (key: string) => boolean;
}
