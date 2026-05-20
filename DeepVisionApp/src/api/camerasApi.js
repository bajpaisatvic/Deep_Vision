import client from './client';
import { DJANGO_URL } from '../config';

export const camerasApi = {
  list: () => client.get('/cameras/'),

  detail: (id) => client.get(`/cameras/${id}/`),

  create: (data) => client.post('/cameras/', data),

  update: (id, data) => client.patch(`/cameras/${id}/`, data),

  remove: (id) => client.delete(`/cameras/${id}/`),

  stopStream: (id) => client.post(`/cameras/${id}/stop/`),

  streamUrl: (id) => `${DJANGO_URL}/api/cameras/${id}/stream/`,

  simulate: () => client.post('/cameras/simulate/'),
};
