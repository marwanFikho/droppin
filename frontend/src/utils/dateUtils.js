import moment from 'moment-timezone';

// Cairo timezone
const CAIRO_TIMEZONE = 'Africa/Cairo';

/**
 * Format date to dd-mm-yyyy format in Cairo timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateToDDMMYYYY = (date) => {
  if (!date) return 'Not set';
  try {
    return moment(date).tz(CAIRO_TIMEZONE).format('DD-MM-YYYY');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format datetime to dd-mm-yyyy HH:mm:ss format in Cairo timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTimeToDDMMYYYY = (date) => {
  if (!date) return 'Not set';
  try {
    return moment(date).tz(CAIRO_TIMEZONE).format('DD-MM-YYYY HH:mm:ss');
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid date';
  }
};

/**
 * Format date for display in Cairo timezone (legacy function for compatibility)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'Not set';
  try {
    return moment(date).tz(CAIRO_TIMEZONE).format('DD-MM-YYYY HH:mm:ss');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Get current date and time in Cairo timezone
 * @returns {Date} Date object in Cairo timezone
 */
export const getCairoDateTime = () => {
  return moment().tz(CAIRO_TIMEZONE).toDate();
}; 