export interface AIOrganizeRequest {
  title: string;
  url: string;
  description: string | null;
  h1: string | null;
  folderTree: string;
}

export interface AIOrganizeResponse {
  folderPath: string;
  isNewFolder: boolean;
}
