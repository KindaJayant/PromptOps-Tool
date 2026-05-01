const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let detail = null;
    try {
      const payload = await response.json();
      detail = payload.detail ?? payload.message ?? null;
      if (typeof detail === 'string') {
        message = detail;
      } else if (detail?.message) {
        message = detail.message;
      } else if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore parsing failures on non-JSON error bodies.
    }
    const error = new Error(message);
    error.detail = detail;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const api = {
  listPrompts: () => request('/prompts'),
  createPrompt: (data) =>
    request('/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  getPrompt: (id) => request(`/prompts/${id}`),
  updatePrompt: (id, data) =>
    request(`/prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deletePrompt: (id) =>
    request(`/prompts/${id}`, {
      method: 'DELETE',
    }),

  listVersions: (promptId) => request(`/prompts/${promptId}/versions`),
  createVersion: (promptId, data) =>
    request(`/prompts/${promptId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  getVersion: (id) => request(`/versions/${id}`),
  runPlayground: (promptId, data) =>
    request(`/prompts/${promptId}/playground-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateTag: (versionId, tag, force = false) =>
    request(`/versions/${versionId}/tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, force }),
    }),
  rollbackVersion: (versionId) =>
    request(`/versions/${versionId}/rollback`, {
      method: 'POST',
    }),

  getDiff: (v1, v2) => request(`/diff?v1=${v1}&v2=${v2}`),

  listTestCases: (promptId) => request(`/prompts/${promptId}/test-cases`),
  createTestCase: (promptId, data) =>
    request(`/prompts/${promptId}/test-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  importTestCases: (promptId, testCases) =>
    request(`/prompts/${promptId}/test-cases/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_cases: testCases }),
    }),

  runTests: (versionId) =>
    request(`/versions/${versionId}/run-tests`, {
      method: 'POST',
    }),
  listTestRuns: (versionId) => request(`/versions/${versionId}/test-runs`),

  getAnalytics: (promptId) => request(`/prompts/${promptId}/analytics`),
};
