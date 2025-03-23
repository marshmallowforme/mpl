const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} - JWT token
 */
exports.generateToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded token
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};