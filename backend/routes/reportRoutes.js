const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/sales', reportController.getSalesReport);
router.get('/users', reportController.getUserReport);
router.post('/generate', reportController.generateReport);

module.exports = router; // Correct export