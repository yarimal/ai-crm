import config from '../config';

const API_BASE = config.apiBaseUrl;

// Provider API
export const providerService = {
  async getAll() {
    const res = await fetch(`${API_BASE}/providers`);
    if (!res.ok) throw new Error('Failed to fetch providers');
    return res.json();
  },

  async create(data) {
    const res = await fetch(`${API_BASE}/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create provider');
    return res.json();
  },

  async update(id, data) {
    const res = await fetch(`${API_BASE}/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update provider');
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_BASE}/providers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete provider');
    return true;
  }
};

// Client API
export const clientService = {
  async getAll(search = '') {
    const url = search 
      ? `${API_BASE}/clients?search=${encodeURIComponent(search)}`
      : `${API_BASE}/clients`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },

  async create(data) {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create client');
    return res.json();
  },

  async update(id, data) {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update client');
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete client');
    return true;
  }
};

// Appointment API
export const appointmentService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.providerId) params.append('provider_id', filters.providerId);
    if (filters.clientId) params.append('client_id', filters.clientId);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    
    const url = `${API_BASE}/appointments${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async create(data) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create appointment');
    }
    return res.json();
  },

  async update(id, data) {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update appointment');
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete appointment');
    return true;
  },

  async checkAvailability(date, providerId = null, duration = 30) {
    const params = new URLSearchParams({ date, duration_minutes: duration });
    if (providerId) params.append('provider_id', providerId);
    
    const res = await fetch(`${API_BASE}/appointments/availability?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to check availability');
    return res.json();
  }
};

// Event service (for backward compatibility with calendar)
export const eventService = {
  async getEvents() {
    return appointmentService.getAll();
  },

  async createEvent(data) {
    return appointmentService.create(data);
  },

  async updateEvent(id, data) {
    return appointmentService.update(id, data);
  },

  async deleteEvent(id) {
    return appointmentService.delete(id);
  }
};

// Chat API
export const chatService = {
  async sendMessage(message, chatId = null) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chat_id: chatId })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async getChats() {
    const res = await fetch(`${API_BASE}/chats`);
    if (!res.ok) throw new Error('Failed to fetch chats');
    return res.json();
  }
};
