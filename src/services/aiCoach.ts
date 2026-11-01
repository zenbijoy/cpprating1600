import { storageService } from './storage';

export interface CoachResponse {
  success: boolean;
  mode: string;
  source: string;
  message: string;
  warning?: string;
}

function getCoachHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const key = storageService.getGeminiApiKey();
  if (key) {
    headers['x-gemini-api-key'] = key;
  }
  return headers;
}

export const aiCoachService = {
  async testConnection(apiKey: string): Promise<{ success: boolean; configured: boolean; message?: string; error?: string }> {
    const res = await fetch('/api/settings/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    return res.json();
  },

  async askConcept(topicTitle: string, question?: string, language: 'en' | 'bn' = 'en'): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'concept_teacher',
        payload: { topicTitle, userQuestion: question, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async getHint(
    problemName: string,
    hintLevel: number,
    userApproach?: string,
    codeLanguage?: string,
    language: 'en' | 'bn' = 'en'
  ): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'hint_ladder',
        payload: { problemName, hintLevel, userApproach, codeLanguage, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async reviewCode(
    problemName: string,
    userCode: string,
    codeLanguage: string,
    failedTestcase?: string,
    language: 'en' | 'bn' = 'en'
  ): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'code_review',
        payload: { problemName, userCode, codeLanguage, failedTestcase, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async explainEditorial(problemName: string, statement?: string, language: 'en' | 'bn' = 'en'): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'editorial_explainer',
        payload: { problemName, problemStatement: statement, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async getPersonalCoachReview(userProfile: {
    currentDay: number;
    targetRating: number;
    streak: number;
    weakTopic?: string;
  }, language: 'en' | 'bn' = 'en'): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'personal_coach',
        payload: { userProfile, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async getMicroAction(topicTitle: string, language: 'en' | 'bn' = 'en'): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'anti_procrastination',
        payload: { topicTitle, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async getCounterexample(payload: {
    problemName: string;
    problemStatement?: string;
    userApproach?: string;
    userCode?: string;
  }): Promise<{
    success: boolean;
    isAISuggestion?: boolean;
    disclaimer?: string;
    counterexampleInput: string;
    expectedOutput: string;
    explanation: string;
  }> {
    const res = await fetch('/api/ai/counterexample', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async explainProblem(problemName: string, statement?: string, language: 'en' | 'bn' = 'en'): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'explain_problem',
        payload: { problemName, problemStatement: statement, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async suggestAlgorithm(
    problemName: string,
    statement?: string,
    userApproach?: string,
    language: 'en' | 'bn' = 'en'
  ): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'suggest_algorithm',
        payload: { problemName, problemStatement: statement, userApproach, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async explainComplexity(
    problemName: string,
    code: string,
    codeLanguage: string,
    language: 'en' | 'bn' = 'en'
  ): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'explain_complexity',
        payload: { problemName, userCode: code, codeLanguage, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async generateExamples(problemName: string, statement?: string, language: 'en' | 'bn' = 'en'): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'generate_examples',
        payload: { problemName, problemStatement: statement, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async explainEdgeCases(problemName: string, statement?: string, language: 'en' | 'bn' = 'en'): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'edge_cases',
        payload: { problemName, problemStatement: statement, explanationLanguage: language },
      }),
    });
    return res.json();
  },

  async createRevisionCard(
    problemName: string,
    userMistake: string,
    language: 'en' | 'bn' = 'en'
  ): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: getCoachHeaders(),
      body: JSON.stringify({
        mode: 'create_revision_card',
        payload: { problemName, userMistake, explanationLanguage: language },
      }),
    });
    return res.json();
  },
};
