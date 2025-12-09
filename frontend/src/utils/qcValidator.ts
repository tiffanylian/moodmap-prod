/**
 * Quality Control validator for frontend
 * Performs client-side profanity and self-harm detection
 */

import Filter from 'bad-words';

export interface QCCheckResult {
  status: "safe" | "blocked";
  message: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const filter = new Filter();

/**
 * Check text content via backend QC service or local validation
 */
export async function checkContentQuality(text: string): Promise<QCCheckResult> {
  if (!text) {
    return {
      status: "safe",
      message: "",
    };
  }

  // First, check locally for immediate blocking
  const localCheck = quickValidateText(text);
  if (localCheck.hasIssues) {
    return {
      status: "blocked",
      message: localCheck.warningMessage,
    };
  }

  // Then try backend check as well
  try {
    const response = await fetch(`${BACKEND_URL}/qc/check?text=${encodeURIComponent(text)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`QC check failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    // On backend error, use local result (already checked above)
    console.warn("QC backend check error:", error);
    return {
      status: "safe",
      message: "",
    };
  }
}

/**
 * Local client-side validation
 * Checks for profanity and self-harm keywords
 */
export function quickValidateText(text: string): {
  hasIssues: boolean;
  warningMessage: string;
} {
  if (!text) {
    return {
      hasIssues: false,
      warningMessage: "",
    };
  }

  // Check for profanity using library
  if (filter.isProfane(text)) {
    return {
      hasIssues: true,
      warningMessage: "Your message contains inappropriate language.",
    };
  }

  // Check for self-harm/crisis keywords
  const selfHarmKeywords = [
    "suici",
    "kill myself",
    "self harm",
    "self-harm",
    "want to die",
    "overdose",
    "cutting",
    "burning myself",
    "hurting myself",
    "end it all",
    "unalive",
  ];

  const textLower = text.toLowerCase();
  for (const keyword of selfHarmKeywords) {
    if (textLower.includes(keyword)) {
      return {
        hasIssues: true,
        warningMessage: "Your message contains concerning content. Please reach out to PennCAPS at 215-898-7021 or call 988.",
      };
    }
  }

  return {
    hasIssues: false,
    warningMessage: "",
  };
}

