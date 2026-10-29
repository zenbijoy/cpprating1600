export interface CoachResponse {
  success: boolean;
  mode: string;
  source: string;
  message: string;
  warning?: string;
}

export const aiCoachService = {
  async askConcept(topicTitle: string, question?: string): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'concept_teacher',
        payload: { topicTitle, userQuestion: question },
      }),
    });
    return res.json();
  },

  async getHint(
    problemName: string,
    hintLevel: number,
    userApproach?: string,
    codeLanguage?: string
  ): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'hint_ladder',
        payload: { problemName, hintLevel, userApproach, codeLanguage },
      }),
    });
    return res.json();
  },

  async reviewCode(
    problemName: string,
    userCode: string,
    codeLanguage: string,
    failedTestcase?: string
  ): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'code_review',
        payload: { problemName, userCode, codeLanguage, failedTestcase },
      }),
    });
    return res.json();
  },

  async explainEditorial(problemName: string, statement?: string): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'editorial_explainer',
        payload: { problemName, problemStatement: statement },
      }),
    });
    return res.json();
  },

  async getPersonalCoachReview(userProfile: {
    currentDay: number;
    targetRating: number;
    streak: number;
    weakTopic?: string;
  }): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'personal_coach',
        payload: { userProfile },
      }),
    });
    return res.json();
  },

  async getMicroAction(topicTitle: string): Promise<CoachResponse> {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'anti_procrastination',
        payload: { topicTitle },
      }),
    });
    return res.json();
  },
};
