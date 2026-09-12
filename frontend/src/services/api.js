const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('samarth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseErrorMessage(data, fallbackMsg) {
  if (!data || !data.detail) return fallbackMsg;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map(e => (typeof e === 'object' ? (e.msg || JSON.stringify(e)) : String(e))).join(' ');
  }
  if (typeof data.detail === 'object') {
    if (data.detail.validation_errors) {
      return Object.values(data.detail.validation_errors).join(' ');
    }
    return JSON.stringify(data.detail);
  }
  return fallbackMsg;
}

export const api = {
  // Token management
  getToken: () => localStorage.getItem('samarth_token'),
  setToken: (token) => localStorage.setItem('samarth_token', token),
  removeToken: () => localStorage.removeItem('samarth_token'),

  // Health Check
  getHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Backend health check failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, fallback mode active:', err.message);
      return { status: 'offline' };
    }
  },

  // Auth: Register
  register: async (email, password, role = 'student') => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(parseErrorMessage(data, 'Registration failed'));
    }
    if (data.access_token) {
      api.setToken(data.access_token);
    }
    return data;
  },

  // Auth: Login
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(parseErrorMessage(data, 'Login failed'));
    }
    if (data.access_token) {
      api.setToken(data.access_token);
    }
    return data;
  },

  // Auth: Get Current User
  getCurrentUser: async () => {
    const token = api.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) {
        api.removeToken();
        return null;
      }
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Auth: Logout
  logout: () => {
    api.removeToken();
  },

  // Student: Create or Update Profile
  createStudent: async (studentData) => {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(studentData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(parseErrorMessage(data, 'Failed to save student profile'));
    }
    return data;
  },

  // Student: Get Current Student Profile
  getMyStudentProfile: async () => {
    try {
      const res = await fetch(`${API_BASE}/students/me`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Student: Get All Students
  getStudents: async () => {
    try {
      const res = await fetch(`${API_BASE}/students`);
      if (!res.ok) throw new Error('Failed to fetch students');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Opportunities: Get All Active
  getOpportunities: async () => {
    try {
      const res = await fetch(`${API_BASE}/opportunities`);
      if (!res.ok) throw new Error('Failed to fetch opportunities');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Opportunities: Create
  createOpportunity: async (oppData) => {
    const res = await fetch(`${API_BASE}/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(oppData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(parseErrorMessage(data, 'Failed to create opportunity posting'));
    }
    return data;
  },

  // Opportunities: Soft-delete / Remove
  deleteOpportunity: async (opportunityId) => {
    const res = await fetch(`${API_BASE}/opportunities/${opportunityId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(parseErrorMessage(data, 'Failed to remove posting'));
    }
    return data;
  },

  // Applications: Submit Application (Pending state)
  applyOpportunity: async (opportunityId) => {
    const numericId = parseInt(opportunityId, 10);
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ opportunity_id: isNaN(numericId) ? opportunityId : numericId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(parseErrorMessage(data, 'Failed to submit application'));
    }
    return data;
  },

  // Applications: Get My Applications
  getMyApplications: async () => {
    try {
      const res = await fetch(`${API_BASE}/applications/me`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      return [];
    }
  },
};
