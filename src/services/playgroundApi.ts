import {
  PlaygroundExecutionResult,
  AiDebugRequest,
  AiDebugResponse,
  PlaygroundSnippet,
  ProgrammingLanguage,
} from '../types';
import { supabase } from './supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Guest or no session
  }
  return headers;
}

export const playgroundApi = {
  async execute(params: {
    code: string;
    language: ProgrammingLanguage;
    stdin?: string;
    timeoutMs?: number;
  }): Promise<PlaygroundExecutionResult> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/playground/execute', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          status: 'PROVIDER_ERROR',
          message: (err as any).message || (err as any).error || `Execution failed with status ${res.status}`,
        };
      }
      return await res.json();
    } catch (err: any) {
      return {
        status: 'BACKEND_UNAVAILABLE',
        message: err.message || 'Network error reaching code execution runner.',
      };
    }
  },

  async aiDebug(params: AiDebugRequest): Promise<AiDebugResponse> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/playground/ai-debug', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || (err as any).message || `AI Debug request failed: ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        summary: 'AI debugger is currently unavailable.',
        errorCategory: 'PROVIDER_ERROR',
        evidence: '',
        rootCause: err.message || 'Service communication error',
        suggestedFix: 'Please check your Gemini API key configuration in Settings or try again shortly.',
        confidence: 'low',
        disclaimer: 'This diagnostic error originates from the AI service proxy, not your compiled source code.',
        source: 'error',
      };
    }
  },

  async getSupportedLanguages(): Promise<{
    languages: { id: string; name: string; version: string; std?: string }[];
  }> {
    try {
      const res = await fetch('/api/playground/languages');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return {
      languages: [
        { id: 'cpp20', name: 'C++20', version: 'GCC', std: 'c++20' },
        { id: 'cpp17', name: 'C++17', version: 'GCC', std: 'c++17' },
        { id: 'c', name: 'C', version: 'GCC', std: 'c11' },
        { id: 'python', name: 'Python 3', version: '3.x' },
      ],
    };
  },

  // Snippets CRUD (authenticated)
  async listSnippets(): Promise<{ snippets: PlaygroundSnippet[] }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/playground/snippets', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || 'Failed to retrieve saved snippets.');
    }
    return res.json();
  },

  async saveSnippet(snippet: {
    title: string;
    description?: string;
    language: ProgrammingLanguage;
    code: string;
  }): Promise<{ snippet: PlaygroundSnippet }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/playground/snippets', {
      method: 'POST',
      headers,
      body: JSON.stringify(snippet),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || 'Failed to save code snippet.');
    }
    return res.json();
  },

  async updateSnippet(
    id: string,
    updates: { title?: string; description?: string; language?: ProgrammingLanguage; code?: string }
  ): Promise<{ snippet: PlaygroundSnippet }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/playground/snippets/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || 'Failed to update snippet.');
    }
    return res.json();
  },

  async deleteSnippet(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/playground/snippets/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || 'Failed to delete snippet.');
    }
  },
};
