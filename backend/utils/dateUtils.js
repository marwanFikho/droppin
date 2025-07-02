const moment = require('moment-timezone');

// Cairo timezone
const CAIRO_TIMEZONE = 'Africa/Cairo';

/**
 * Get current date and time in Cairo timezone or parse existing date
 * @param {Date|string} date - Optional date to parse, if not provided uses current time
 * @returns {Date} Date object in Cairo timezone
 */
const getCairoDateTime = (date = null) => {
  if (date) {
    return moment(date).tz(CAIRO_TIMEZONE).toDate();
  }
  return moment().tz(CAIRO_TIMEZONE).toDate();
};

/**
 * Format date to dd-mm-yyyy format in Cairo timezone
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDateToDDMMYYYY = (date) => {
  if (!date) return null;
  return moment(date).tz(CAIRO_TIMEZONE).format('DD-MM-YYYY');
};

/**
 * Format datetime to dd-mm-yyyy HH:mm:ss format in Cairo timezone
 * @param {Date} date - Date to format
 * @returns {string} Formatted datetime string
 */
const formatDateTimeToDDMMYYYY = (date) => {
  if (!date) return null;
  return moment(date).tz(CAIRO_TIMEZONE).format('DD-MM-YYYY HH:mm:ss');
};

/**
 * Convert UTC date to Cairo timezone and format as dd-mm-yyyy
 * @param {Date} utcDate - UTC date from database
 * @returns {string} Formatted date string in Cairo timezone
 */
const convertUTCToCairoDate = (utcDate) => {
  if (!utcDate) return null;
  return moment.utc(utcDate).tz(CAIRO_TIMEZONE).format('DD-MM-YYYY');
};

/**
 * Convert UTC datetime to Cairo timezone and format as dd-mm-yyyy HH:mm:ss
 * @param {Date} utcDate - UTC date from database
 * @returns {string} Formatted datetime string in Cairo timezone
 */
const convertUTCToCairoDateTime = (utcDate) => {
  if (!utcDate) return null;
  return moment.utc(utcDate).tz(CAIRO_TIMEZONE).format('DD-MM-YYYY HH:mm:ss');
};

module.exports = {
  getCairoDateTime,
  formatDateToDDMMYYYY,
  formatDateTimeToDDMMYYYY,
  convertUTCToCairoDate,
  convertUTCToCairoDateTime,
  CAIRO_TIMEZONE
}; 