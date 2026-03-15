import { type AIOrganizeRequest, type AIOrganizeResponse } from '../../types/ai';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { getApiKey, callProvider } from './providerUtils';
import { debug } from '../../utils/debug';

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

  debug(
    '[AI] Full prompt sent:\n\n--- SYSTEM ---\n' +
      SYSTEM_PROMPT +
      '\n\n--- USER ---\n' +
      userPrompt +
      '\n\n--- MODEL ---\n' +
      selectedModel
  );

  const responseText = await callProvider(serviceId, apiKey, SYSTEM_PROMPT, userPrompt, selectedModel);

  debug('[AI] Raw response:', responseText);

  const result = parseOrganizeResponse(responseText);

  debug('[AI] Parsed response:', result);

  return result;
};
