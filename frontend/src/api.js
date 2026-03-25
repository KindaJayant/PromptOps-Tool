const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // Prompts
  listPrompts: () => fetch(`${API_BASE_URL}/prompts`).then(r => r.json()),
  createPrompt: (data) => fetch(`${API_BASE_URL}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  getPrompt: (id) => fetch(`${API_BASE_URL}/prompts/${id}`).then(r => r.json()),
  updatePrompt: (id, data) => fetch(`${API_BASE_URL}/prompts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deletePrompt: (id) => fetch(`${API_BASE_URL}/prompts/${id}`, {
    method: 'DELETE'
  }).then(r => r.json()),

  // Versions
  listVersions: (promptId) => fetch(`${API_BASE_URL}/prompts/${promptId}/versions`).then(r => r.json()),
  createVersion: (promptId, data) => fetch(`${API_BASE_URL}/prompts/${promptId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  getVersion: (id) => fetch(`${API_BASE_URL}/versions/${id}`).then(r => r.json()),
  updateTag: (versionId, tag) => fetch(`${API_BASE_URL}/versions/${versionId}/tag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag })
  }).then(r => r.json()),
  rollbackVersion: (versionId) => fetch(`${API_BASE_URL}/versions/${versionId}/rollback`, {
    method: 'POST'
  }).then(r => r.json()),

  // Diff
  getDiff: (v1, v2) => fetch(`${API_BASE_URL}/diff?v1=${v1}&v2=${v2}`).then(r => r.json()),

  // Test Cases
  listTestCases: (promptId) => fetch(`${API_BASE_URL}/prompts/${promptId}/test-cases`).then(r => r.json()),
  createTestCase: (promptId, data) => fetch(`${API_BASE_URL}/prompts/${promptId}/test-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // Test Runs
  runTests: (versionId) => fetch(`${API_BASE_URL}/versions/${versionId}/run-tests`, {
    method: 'POST'
  }).then(r => r.json()),
  listTestRuns: (versionId) => fetch(`${API_BASE_URL}/versions/${versionId}/test-runs`).then(r => r.json()),
};
