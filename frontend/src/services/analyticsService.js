import api from './api';

export const analyticsService = {
  getOverview: async (startDate = null, endDate = null, providerId = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (providerId) params.append('provider_id', providerId);

    const queryString = params.toString();
    const url = queryString ? `/analytics/overview?${queryString}` : '/analytics/overview';

    return api.get(url);
  },

  getAppointmentsOverTime: async (startDate = null, endDate = null, providerId = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (providerId) params.append('provider_id', providerId);

    const queryString = params.toString();
    const url = queryString ? `/analytics/appointments-over-time?${queryString}` : '/analytics/appointments-over-time';

    return api.get(url);
  },

  getAppointmentsByProvider: async (startDate = null, endDate = null, providerId = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (providerId) params.append('provider_id', providerId);

    const queryString = params.toString();
    const url = queryString ? `/analytics/appointments-by-provider?${queryString}` : '/analytics/appointments-by-provider';

    return api.get(url);
  },

  getAppointmentsByStatus: async (startDate = null, endDate = null, providerId = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (providerId) params.append('provider_id', providerId);

    const queryString = params.toString();
    const url = queryString ? `/analytics/appointments-by-status?${queryString}` : '/analytics/appointments-by-status';

    return api.get(url);
  },

  getRealtimeMetrics: async (providerId = null) => {
    const params = new URLSearchParams();
    if (providerId) params.append('provider_id', providerId);

    const queryString = params.toString();
    const url = queryString ? `/analytics/realtime?${queryString}` : '/analytics/realtime';

    return api.get(url);
  }
};
