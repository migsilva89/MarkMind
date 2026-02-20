export interface ModelOption {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface ServiceTestConfig {
  getEndpoint: (apiKey: string, model?: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
  getBody: (model: string) => Record<string, unknown>;
  validateResponse: (data: unknown) => boolean;
}

export interface ServiceConfig {
  id: string;
  name: string;
  label: string;
  storageKey: string;
  placeholder: string;
  helpLink: string;
  helpLinkText: string;
  models: ModelOption[];
  freeTierNote?: string;
  validateKey: (key: string) => boolean;
  testConfig: ServiceTestConfig;
}
