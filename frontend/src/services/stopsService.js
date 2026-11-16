import apiClient from './api.js';

const ENDPOINT = '/stops';

export const stopsService = {
  getAllStops: async () => {
    const response = await apiClient.get(ENDPOINT);
    return Array.isArray(response) ? response : [];
  },

  createStop: async (stopData) => {
    return apiClient.post(ENDPOINT, stopData);
  },

  updateStop: async (id, stopData) => {
    return apiClient.put(`${ENDPOINT}/${id}`, stopData);
  },

  deleteStop: async (id) => {
    return apiClient.delete(`${ENDPOINT}/${id}`);
  },
};

export default stopsService;
