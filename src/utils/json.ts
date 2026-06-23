// AI models sometimes emit raw control characters (literal newlines, tabs, etc.)
// inside JSON string values — for example a multi-line "summary". Those break
// JSON.parse with "Bad control character in string literal". This walks the text
// and escapes any control characters that appear INSIDE string literals, leaving
// structural whitespace untouched.
export const escapeControlCharsInJsonStrings = (json: string): string => {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let index = 0; index < json.length; index += 1) {
    const char = json[index];

    // Previous char was a backslash — keep this char as-is (it's an escape sequence).
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      const code = char.charCodeAt(0);
      if (code < 0x20) {
        if (char === '\n') result += '\\n';
        else if (char === '\r') result += '\\r';
        else if (char === '\t') result += '\\t';
        else result += `\\u${code.toString(16).padStart(4, '0')}`;
        continue;
      }
    }

    result += char;
  }

  return result;
};

// Parses JSON, retrying with control characters escaped if the first attempt
// fails — tolerant of the malformed-but-recoverable JSON models often produce.
export const parseJsonLoose = (jsonText: string): unknown => {
  try {
    return JSON.parse(jsonText);
  } catch {
    return JSON.parse(escapeControlCharsInJsonStrings(jsonText));
  }
};
