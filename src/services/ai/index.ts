import { type AIOrganizeRequest, type AIOrganizeResponse } from '../../types/ai';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { getApiKey, callProvider } from './providerUtils';

const parseOrganizeResponse = (responseText: string): AIOrganizeResponse => {
  let folderPath = responseText.trim();

  // Strip markdown code fences (some models wrap response in ```...```)
  const fenceMatch = folderPath.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    folderPath = fenceMatch[1].trim();
  }

  // Strip surrounding quotes
  folderPath = folderPath.replace(/^["'`]|["'`]$/g, '').trim();

  if (!folderPath) {
    throw new Error('AI returned an empty folder path');
  }

  // Guard against accidental JSON blobs from verbose models
  if (folderPath.startsWith('{') || folderPath.startsWith('[')) {
    throw new Error('AI returned JSON instead of a folder path');
  }

  const isNewFolder = folderPath.startsWith('NEW:');
  if (isNewFolder) {
    folderPath = folderPath.replace(/^NEW:\s*/, '').trim();
  }

  return { folderPath, isNewFolder };
};

export const organizeBookmark = async (
  serviceId: string,
  selectedModel: string,
  request: AIOrganizeRequest
): Promise<AIOrganizeResponse> => {
  const apiKey = await getApiKey(serviceId);
  const userPrompt = buildUserPrompt(request);

  const responseText = await callProvider(serviceId, apiKey, SYSTEM_PROMPT, userPrompt, selectedModel);

  return parseOrganizeResponse(responseText);
};
