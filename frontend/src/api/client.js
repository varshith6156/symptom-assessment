const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(endpoint, options = {}, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail?.error || data?.detail || `Request failed with status ${response.status}`;
    const error = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  async getHealth() {
    return request('/api/health');
  },

  async createSession() {
    return request('/api/sessions', {
      method: 'POST',
    });
  },

  async sendMessage(sessionId, token, content) {
    return request(
      `/api/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
      token
    );
  },

  async updateFacts(sessionId, token, updates, disputedRuleId = null, clearEscalation = false) {
    return request(
      `/api/sessions/${sessionId}/facts`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          updates,
          disputed_rule_id: disputedRuleId,
          clear_escalation_if_disputed: clearEscalation,
        }),
      },
      token
    );
  },

  async getReport(sessionId, token) {
    return request(`/api/sessions/${sessionId}/report`, { method: 'GET' }, token);
  },

  async deleteSession(sessionId, token) {
    return request(`/api/sessions/${sessionId}`, { method: 'DELETE' }, token);
  },
};
