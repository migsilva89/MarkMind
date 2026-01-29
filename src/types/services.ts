export interface ServiceTestConfig {
  getEndpoint: (apiKey: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
  getBody: () => Record<string, unknown>;
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
  validateKey: (key: string) => boolean;
  testConfig: ServiceTestConfig;
}
