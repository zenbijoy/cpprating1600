// Codeforces handle validation rules
// Length: between 3 and 24 characters
// Allowed characters: Latin letters (a-z, A-Z), digits (0-9), underscores (_), hyphens (-), and periods (.)
export const CF_HANDLE_REGEX = /^[a-zA-Z0-9_.-]{3,24}$/;

export interface HandleValidationResult {
  valid: boolean;
  error?: string;
  normalized: string;
  original: string;
}

export function validateHandle(rawHandle: unknown): HandleValidationResult {
  if (typeof rawHandle !== 'string') {
    return { valid: false, error: 'Codeforces handle must be a string.', normalized: '', original: '' };
  }
  const trimmed = rawHandle.trim();
  if (!trimmed) {
    return { valid: false, error: 'Codeforces handle cannot be empty.', normalized: '', original: '' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'Codeforces handle must be at least 3 characters.', normalized: '', original: trimmed };
  }
  if (trimmed.length > 24) {
    return { valid: false, error: 'Codeforces handle must be at most 24 characters.', normalized: '', original: trimmed };
  }
  if (!CF_HANDLE_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Codeforces handle may only contain letters, digits, underscores, hyphens, and dots.',
      normalized: '',
      original: trimmed,
    };
  }
  return {
    valid: true,
    normalized: trimmed.toLowerCase(),
    original: trimmed,
  };
}
