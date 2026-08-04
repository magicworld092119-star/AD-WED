import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
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
  uploadAndPredict: async (file, patientId, patientAge, gender) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    formData.append('patient_age', patientAge);
    formData.append('gender', gender);

    const response = await API.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const historyAPI = {
  getHistory: async () => {
    const response = await API.get('/history');
    return response.data;
  },
};

export default API;
