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
  login: async (email, password) => {//manage login
    const response = await API.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData) => {// manage register
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
  generateClinicalProfile: async (payload) => {
    const response = await API.post('/predict/generate-clinical-profile', payload);
    return response.data;
  },
  getSaliencyProfile: async (predictionId, targetClass = 'predicted') => {
    const response = await API.get(`/predict/${predictionId}/saliency-profile`, {
      params: { target_class: targetClass },
    });
    return response.data;
  },
  chatAboutScan: async (payload) => {
    const response = await API.post('/predict/chat', payload);
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

export const getScanSliceUrl = (predictionId, plane = 'axial', sliceIdx = 48, heatmap = true, opacity = 75, colormap = 'turbo', targetClass = 'predicted') => {
  if (!predictionId) return null;
  const baseUrl = 'http://localhost:8000';
  return `${baseUrl}/api/v1/predict/${predictionId}/slice?plane=${plane.toLowerCase()}&slice_idx=${sliceIdx}&heatmap=${heatmap}&opacity=${opacity}&colormap=${colormap.toLowerCase()}&target_class=${(targetClass || 'predicted').toLowerCase()}`;
};

export default API;
