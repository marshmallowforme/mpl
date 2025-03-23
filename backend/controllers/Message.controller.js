const Message = require('../models/Message.model');
const Conversation = require('../models/Conversation.model');
const { createError } = require('../utils/errorUtil');

/**
 * Get all conversations for a user
 * @route GET /api/messages/conversations
 * @access Private
 */
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name profileImage')
      .populate('product', 'title images price')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a conversation
 * @route GET /api/messages/conversations/:id
 * @access Private
 */
exports.getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return next(createError(403, 'Not authorized to view this conversation'));
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { 
        conversation: req.params.id, 
        sender: { $ne: req.user.id },
        isRead: false
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new conversation
 * @route POST /api/messages/conversations
 * @access Private
 */
exports.createConversation = async (req, res, next) => {
  try {
    const { recipient, product, initialMessage } = req.body;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipient] },
      product
    });

    // If conversation doesn't exist, create one
    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, recipient],
        product
      });
      await conversation.save();
    }

    // Create message
    const message = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: initialMessage
    });

    await message.save();

    // Update conversation with last message
    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).json({
      success: true,
      data: {
        conversation,
        message
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message
 * @route POST /api/messages/conversations/:id
 * @access Private
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return next(createError(404, 'Conversation not found'));
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return next(createError(403, 'Not authorized to send messages in this conversation'));
    }

    // Create message
    const message = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content
    });

    await message.save();

    // Update conversation with last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'name profileImage');

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread message count
 * @route GET /api/messages/unread
 * @access Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    });

    const conversationIds = conversations.map(conv => conv._id);

    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.user.id },
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};