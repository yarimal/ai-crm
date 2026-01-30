/**
 * Event Service - Calendar event API operations
 */
import api from './api';

/**
 * Get all events
 * @param {Date} start - Optional start date filter
 * @param {Date} end - Optional end date filter
 */
export async function getEvents(start = null, end = null) {
  let endpoint = '/events';
  const params = new URLSearchParams();
  
  if (start) params.append('start', start.toISOString());
  if (end) params.append('end', end.toISOString());
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  
  return api.get(endpoint);
}

/**
 * Get a single event by ID
 * @param {string} eventId 
 */
export async function getEvent(eventId) {
  return api.get(`/events/${eventId}`);
}

/**
 * Create a new event
 * @param {object} eventData - Event data
 */
export async function createEvent(eventData) {
  // Transform frontend format to backend format
  const payload = {
    title: eventData.title,
    description: eventData.description || eventData.extendedProps?.description || '',
    start: eventData.start,
    end: eventData.end,
    color: eventData.color || '#1a73e8',
    allDay: eventData.allDay || false,
  };
  
  return api.post('/events', payload);
}

/**
 * Update an existing event
 * @param {string} eventId 
 * @param {object} eventData 
 */
export async function updateEvent(eventId, eventData) {
  const payload = {
    title: eventData.title,
    description: eventData.description || eventData.extendedProps?.description || '',
    start: eventData.start,
    end: eventData.end,
    color: eventData.color,
    allDay: eventData.allDay,
  };
  
  // Remove undefined values
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) delete payload[key];
  });
  
  return api.put(`/events/${eventId}`, payload);
}

/**
 * Delete an event
 * @param {string} eventId 
 */
export async function deleteEvent(eventId) {
  return api.delete(`/events/${eventId}`);
}

export default {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};
