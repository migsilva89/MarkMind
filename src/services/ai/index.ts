import { type AIOrganizeRequest, type AIOrganizeResponse } from '../../types/ai';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { getApiKey, callProvider } from './providerUtils';
import { debug } from '../../utils/debug';

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

  let folderPath = await callProvider(serviceId, apiKey, SYSTEM_PROMPT, userPrompt, selectedModel);
  folderPath = folderPath.replace(/^["']|["']$/g, '').trim();

  const isNewFolder = folderPath.startsWith('NEW:');
  if (isNewFolder) {
    folderPath = folderPath.replace(/^NEW:\s*/, '').trim();
  }

  debug('[AI] Response:', { folderPath, isNewFolder });

  return {
    folderPath,
    isNewFolder,
  };
};
