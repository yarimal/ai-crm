/**
 * Event-related utility functions
 */

let eventIdCounter = 100;

/**
 * Generate a unique event ID
 * @returns {string}
 */
export function generateEventId() {
  return `event-${Date.now()}-${eventIdCounter++}`;
}

/**
 * Create a new event object
 * @param {object} params
 * @returns {object}
 */
export function createEvent({ title, start, end, color, description = '' }) {
  return {
    id: generateEventId(),
    title,
    start,
    end,
    color,
    extendedProps: { description }
  };
}

/**
 * Transform form data to event object
 * @param {object} formData - Form data from EventModal
 * @param {string} dateStr - Base date string
 * @param {string} existingId - Existing event ID for updates
 * @returns {object}
 */
export function formDataToEvent(formData, dateStr, existingId = null) {
  const { title, startTime, endTime, description, color } = formData;
  
  return {
    id: existingId || generateEventId(),
    title,
    start: `${dateStr}T${startTime}:00`,
    end: `${dateStr}T${endTime}:00`,
    color,
    extendedProps: { description }
  };
}

/**
 * Extract event data for editing
 * @param {object} calendarEvent - FullCalendar event object
 * @returns {object}
 */
export function extractEventData(calendarEvent) {
  return {
    id: calendarEvent.id,
    title: calendarEvent.title,
    start: calendarEvent.start,
    end: calendarEvent.end,
    color: calendarEvent.backgroundColor || calendarEvent.extendedProps?.color,
    backgroundColor: calendarEvent.backgroundColor,
    extendedProps: calendarEvent.extendedProps
  };
}

export default {
  generateEventId,
  createEvent,
  formDataToEvent,
  extractEventData
};
