const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { createError } = require('../utils/errorUtil');

/**
 * Protect routes - Verify JWT token and set req.user
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(createError(401, 'Not authorized to access this route'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Set req.user
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return next(createError(401, 'User not found'));
      }

      next();
    } catch (error) {
      return next(createError(401, 'Not authorized to access this route'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Admin middleware - Check if user is admin
 */
exports.admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return next(createError(403, 'Not authorized as an admin'));
  }
};

