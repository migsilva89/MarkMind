import { type AIOrganizeRequest, type AIOrganizeResponse } from "../types/ai";
import { SERVICES } from "../config/services";

const SYSTEM_PROMPT = `You are an AI assistant specialized in organizing bookmarks into folders.
Your task is to analyze a bookmark and suggest the best existing folder from the provided hierarchy, or suggest a new folder name if none fit.

CRITICAL RULES:
1. Use existing folders when they semantically match the bookmark content, respecting their hierarchy
2. Match based on content TYPE, not just keywords
3. Services/tools you USE go in tool-related folders
4. Content you READ goes in topic-related folders
5. Create subfolders for related topics WITHIN existing main folders first
6. Maximum folder depth is 3 levels
7. Suggest a NEW folder only if no existing folder or subfolder is appropriate
8. New folders should be clear category names (e.g., "Entertainment", "Finance", "Health")
9. BEFORE suggesting "Other Bookmarks", try: existing folders → existing subfolders → new subfolder → new main folder
10. NEVER use generic folders like "Other Bookmarks" if a better option exists

RESPONSE FORMAT:
- Return the EXACT folder path using "/" as separator, matching folder names from the hierarchy exactly
- Example: if the tree shows Bookmarks > Development Tools > Git, return "Bookmarks/Development Tools/Git"
- If new folder needed: return "NEW: FolderName" (e.g., "NEW: Entertainment")
- If new subfolder in existing folder: return "NEW: ParentFolder/NewSubfolder" (e.g., "NEW: Development Tools/Frameworks")
- Return ONLY the path, no explanation`;

const buildUserPrompt = (request: AIOrganizeRequest): string => {
  const parts = [
    "## PAGE INFORMATION",
    `Title: ${request.title}`,
    `URL: ${request.url}`,
  ];

  if (request.description) {
    parts.push(`Description: ${request.description}`);
  }

  if (request.h1) {
    parts.push(`H1: ${request.h1}`);
  }

  parts.push("");
  parts.push("## EXISTING FOLDER STRUCTURE (hierarchy)");
  parts.push(request.folderTree);
  parts.push("");
  parts.push(
    'Choose the best matching folder path from the hierarchy above, or suggest "NEW: CategoryName" if none fit.',
  );
  parts.push('Return ONLY the exact folder path using "/" as separator:');

  return parts.join("\n");
};

const callGemini = async (apiKey: string, prompt: string): Promise<string> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini");
  }

  return text.trim();
};

const callOpenAI = async (apiKey: string, prompt: string): Promise<string> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No response from OpenAI");
  }

  return text.trim();
};

const callAnthropic = async (
  apiKey: string,
  prompt: string,
): Promise<string> => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;

  if (!text) {
    throw new Error("No response from Anthropic");
  }

  return text.trim();
};

const callOpenRouter = async (
  apiKey: string,
  prompt: string,
): Promise<string> => {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 100,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No response from OpenRouter");
  }

  return text.trim();
};

export const organizeBookmark = async (
  serviceId: string,
  request: AIOrganizeRequest,
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
    "[AI] Full prompt sent:\n\n--- SYSTEM ---\n" +
      SYSTEM_PROMPT +
      "\n\n--- USER ---\n" +
      userPrompt,
  );

  let folderPath: string;

  switch (serviceId) {
    case "google":
      folderPath = await callGemini(apiKey, userPrompt);
      break;
    case "openai":
      folderPath = await callOpenAI(apiKey, userPrompt);
      break;
    case "anthropic":
      folderPath = await callAnthropic(apiKey, userPrompt);
      break;
    case "openrouter":
      folderPath = await callOpenRouter(apiKey, userPrompt);
      break;
    default:
      throw new Error(`Unsupported service: ${serviceId}`);
  }

  folderPath = folderPath.replace(/^["']|["']$/g, "").trim();

  const isNewFolder = folderPath.startsWith("NEW:");
  if (isNewFolder) {
    folderPath = folderPath.replace(/^NEW:\s*/, "").trim();
  }

  console.log("[AI] Response:", { folderPath, isNewFolder });

  return {
    folderPath,
    isNewFolder,
  };
};
