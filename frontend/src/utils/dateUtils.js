/**
 * Date formatting and manipulation utilities
 */

/**
 * Format a date to display time (e.g., "2:30 PM")
 * @param {Date} date 
 * @returns {string}
 */
export function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Format a date for time input (HH:MM)
 * @param {Date} date 
 * @returns {string}
 */
export function formatTimeForInput(date) {
  return date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Format a date to display full date (e.g., "Monday, January 5, 2025")
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatFullDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a date for header display
 * @param {string} dateStr 
 * @returns {object}
 */
export function formatHeaderDate(dateStr) {
  const date = new Date(dateStr);
  const dayNum = date.getDate();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isToday = new Date().toDateString() === date.toDateString();
  
  return { dayNum, dayName, monthYear, isToday };
}

/**
 * Get ISO date string (YYYY-MM-DD)
 * @param {Date|string} date 
 * @returns {string}
 */
export function getISODateString(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Create ISO datetime string from date and time
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:MM format
 * @returns {string}
 */
export function createISODateTime(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`;
}

export default {
  formatTime,
  formatTimeForInput,
  formatFullDate,
  formatHeaderDate,
  getISODateString,
  createISODateTime
};
