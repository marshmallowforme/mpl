// notificationController.js
const getAllNotifications = (req, res) => {
    // Logic to fetch all notifications
    const notifications = [
      { id: 1, message: 'Welcome to the app!' },
      { id: 2, message: 'Your order has been shipped.' },
    ];
    res.json(notifications);
  };
  
  const createNotification = (req, res) => {
    // Logic to create a new notification
    const newNotification = req.body; // Assuming the request body contains notification data
    console.log('Creating notification:', newNotification);
    
    // Emit the new notification to connected clients
    const io = require('../utils/socket').getIO();
    io.emit('notification', newNotification);

    res.status(201).json({ message: 'Notification created successfully', notification: newNotification });
  };
  
  const getNotificationById = (req, res) => {
    // Logic to fetch a notification by ID
    const notificationId = req.params.id;
    const notification = { id: notificationId, message: 'Sample notification' };
    res.json(notification);
  };
  
  const deleteNotification = (req, res) => {
    // Logic to delete a notification
    const notificationId = req.params.id;
    console.log(`Deleting notification with ID: ${notificationId}`);
    res.json({ message: 'Notification deleted successfully', notificationId });
  };
  
  module.exports = {
    getAllNotifications,
    createNotification,
    getNotificationById,
    deleteNotification,
  };
