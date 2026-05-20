import client from './client';

export const alertsApi = {
  list: (params) => client.get('/alerts/', { params }),

  detail: (id) => client.get(`/alerts/${id}/`),

  verify: (id, status) =>
    client.patch(`/alerts/${id}/verify/`, { status }),

  notifications: () => client.get('/notifications/'),

  markRead: (id) => client.patch(`/notifications/${id}/read/`),
};
