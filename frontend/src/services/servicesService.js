import api from './api';

export const servicesService = {
  // Get all services (optionally filtered by provider)
  getAll: async (providerId = null, activeOnly = true) => {
    const params = new URLSearchParams();
    if (providerId) params.append('provider_id', providerId);
    params.append('active_only', activeOnly);
    const queryString = params.toString();
    const url = queryString ? `/services?${queryString}` : '/services';
    return api.get(url);
  },

  // Get a specific service by ID
  getById: async (serviceId) => {
    return api.get(`/services/${serviceId}`);
  },

  // Create a new service
  create: async (serviceData) => {
    return api.post('/services', serviceData);
  },

  // Update an existing service
  update: async (serviceId, serviceData) => {
    return api.put(`/services/${serviceId}`, serviceData);
  },

  // Delete (soft delete) a service
  delete: async (serviceId) => {
    return api.delete(`/services/${serviceId}`);
  }
};
