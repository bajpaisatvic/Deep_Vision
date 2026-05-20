import client from './client';

export const authApi = {
  login: (username, password) =>
    client.post('/auth/login/', { username, password }),

  register: (data) => client.post('/auth/register/', data),

  refreshToken: (refresh) =>
    client.post('/auth/token/refresh/', { refresh }),

  getProfile: () => client.get('/auth/profile/'),

  updateProfile: (data) => client.patch('/auth/profile/', data),
};
