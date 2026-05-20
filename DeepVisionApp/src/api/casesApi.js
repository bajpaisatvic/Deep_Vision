import client from './client';

export const casesApi = {
  list: () => client.get('/cases/'),

  detail: (id) => client.get(`/cases/${id}/`),

  create: (data) => client.post('/cases/', data),

  updateStatus: (id, status) =>
    client.patch(`/cases/${id}/status/`, { status }),

  uploadImage: (caseId, imageUri, mimeType = 'image/jpeg') => {
    const form = new FormData();
    form.append('image', {
      uri: imageUri,
      type: mimeType,
      name: `photo_${Date.now()}.jpg`,
    });
    return client.post(`/cases/${caseId}/images/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
