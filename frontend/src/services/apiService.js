import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach authenticated user information to all outgoing requests
API.interceptors.request.use((config) => {
  try {
    const userStr = localStorage.getItem('ad_web_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`;
      }
      if (user.id) {
        config.headers['X-User-Id'] = user.id;
      }
      if (user.email) {
        config.headers['X-User-Email'] = user.email;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return config;
});

export const authAPI = {
  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await API.post('/auth/register', {
      full_name: userData.fullName,
      email: userData.email,
      password: userData.password,
      hospital_affiliation: userData.hospital,
      role: userData.role,
    });
    return response.data;
  },
};

export const predictAPI = {
  uploadAndPredict: async (file, patientId, patientAge, gender, userId = null, userEmail = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId || '');
    formData.append('patient_age', patientAge || '');
    formData.append('gender', gender || '');

    // Resolve user details if not explicitly passed
    let uid = userId;
    let email = userEmail;
    if (!uid || !email) {
      try {
        const userStr = localStorage.getItem('ad_web_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          uid = uid || user.id;
          email = email || user.email;
        }
      } catch (e) {
        // Ignore
      }
    }

    if (uid) formData.append('user_id', uid);
    if (email) formData.append('user_email', email);

    const response = await API.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const historyAPI = {
  getHistory: async (userId = null, userEmail = null) => {
    let uid = userId;
    let email = userEmail;
    if (!uid && !email) {
      try {
        const userStr = localStorage.getItem('ad_web_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          uid = user.id;
          email = user.email;
        }
      } catch (e) {
        // Ignore
      }
    }

    const params = {};
    if (uid) params.user_id = uid;
    if (email) params.user_email = email;

    const response = await API.get('/history', { params });
    return response.data;
  },
};

export default API;
