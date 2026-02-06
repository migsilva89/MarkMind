import { type AIOrganizeRequest, type AIOrganizeResponse } from '../../types/ai';
import { SERVICES } from '../../config/services';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { callGemini, callOpenAI, callAnthropic, callOpenRouter } from './providers';

export const organizeBookmark = async (
  serviceId: string,
  request: AIOrganizeRequest
): Promise<AIOrganizeResponse> => {
  const service = SERVICES[serviceId];
  if (!service) {
    throw new Error(`Unknown service: ${serviceId}`);
  }

  const storageResult = await chrome.storage.local.get([service.storageKey]);
  const apiKey = storageResult[service.storageKey];

  if (!apiKey) {
    throw new Error(`No API key found for ${service.name}`);
  }

  const userPrompt = buildUserPrompt(request);

  console.log(
    '[AI] Full prompt sent:\n\n--- SYSTEM ---\n' +
      SYSTEM_PROMPT +
      '\n\n--- USER ---\n' +
      userPrompt
  );

  let folderPath: string;

  switch (serviceId) {
    case 'google':
      folderPath = await callGemini(apiKey, SYSTEM_PROMPT, userPrompt);
      break;
    case 'openai':
      folderPath = await callOpenAI(apiKey, SYSTEM_PROMPT, userPrompt);
      break;
    case 'anthropic':
      folderPath = await callAnthropic(apiKey, SYSTEM_PROMPT, userPrompt);
      break;
    case 'openrouter':
      folderPath = await callOpenRouter(apiKey, SYSTEM_PROMPT, userPrompt);
      break;
    default:
      throw new Error(`Unsupported service: ${serviceId}`);
  }

  folderPath = folderPath.replace(/^["']|["']$/g, '').trim();

  const isNewFolder = folderPath.startsWith('NEW:');
  if (isNewFolder) {
    folderPath = folderPath.replace(/^NEW:\s*/, '').trim();
  }

  console.log('[AI] Response:', { folderPath, isNewFolder });

  return {
    folderPath,
    isNewFolder,
  };
};
