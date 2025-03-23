/**
 * Create custom error with status code
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} - Custom error object
 */
exports.createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};