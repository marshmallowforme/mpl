const socketIO = require("socket.io")
const jwt = require("jsonwebtoken")
const User = require("../models/User.model")
const Message = require("../models/Message.model")
const Conversation = require("../models/Conversation.model")
const config = require("../config/config")

let io

// Store connected users
const connectedUsers = new Map()

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 */
exports.init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        console.error("Token is missing during socket connection.");
        return next(new Error("Authentication error"))
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user
      const user = await User.findById(decoded.id).select("-password")

      if (!user) {
        console.error("User not found with token ID:", decoded.id);
        return next(new Error("User not found"))
      }

      // Attach user to socket
      socket.user = user
      next()
    } catch (error) {
        console.error("Socket authentication error:", error);
      return next(new Error("Authentication error"))
    }
  })

  // Connection event
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id}`)

    // Add user to connected users
    connectedUsers.set(socket.user.id, socket.id)

    // Join user's room
    socket.join(socket.user.id)

    // Handle joining conversation
    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`)
      console.log(`User ${socket.user.id} joined conversation ${conversationId}`)
    })

    // Handle leaving conversation
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`)
      console.log(`User ${socket.user.id} left conversation ${conversationId}`)
    })

    // Handle new message
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, content } = data

        // Create message
        const message = new Message({
          conversation: conversationId,
          sender: socket.user.id,
          content,
        })

        await message.save()

        // Update conversation with last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          updatedAt: Date.now(),
        })

        // Populate sender info
        await message.populate("sender", "name profileImage")

        // Emit message to conversation room
        io.to(`conversation:${conversationId}`).emit("new-message", message)

        // Get conversation to find recipients
        const conversation = await Conversation.findById(conversationId)

        // Notify other participants
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.user.id) {
            // Emit to user's room
            io.to(participantId.toString()).emit("message-notification", {
              conversationId,
              message,
            })
          }
        })
      } catch (error) {
        console.error("Error sending message:", error)
        socket.emit("error", { message: "Failed to send message" })
      }
    })

    // Handle typing status
    socket.on("typing", (data) => {
      const { conversationId, isTyping } = data

      // Broadcast typing status to conversation room
      socket.to(`conversation:${conversationId}`).emit("user-typing", {
        userId: socket.user.id,
        isTyping,
      })
    })

    // Handle stop typing
    socket.on("stopTyping", (data) => {
      socket.to(data.recipient).emit("stopTyping", {
        sender: socket.user.id,
        conversation: data.conversation,
      })
    })

    // Disconnect event
    socket.on("disconnect", () => {
      if(socket.user){
      console.log(`User disconnected: ${socket.user.id}`)
      updateUserStatus(socket.user.id, false)
      connectedUsers.delete(socket.user.id)
      }
    })
  })
}

/**
 * Update user's online status
 * @param {string} userId - User ID
 * @param {boolean} isOnline - Online status
 */
const updateUserStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastActive: new Date(),
    })

    // Broadcast user status to friends/contacts
    // This would require a more complex implementation in a real app
  } catch (error) {
    console.error("Error updating user status:", error)
  }
}

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {boolean} - Whether user is online
 */
exports.isUserOnline = (userId) => {
  return connectedUsers.has(userId.toString())
}

/**
 * Send notification to user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Notification data
 */
exports.sendNotification = (userId, event, data) => {
  const socketId = connectedUsers.get(userId.toString())

  if (socketId) {
    io.to(socketId).emit(event, data)
  }
}

/**
 * Get Socket.IO instance
 * @returns {Object} - Socket.IO instance
 */
exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized")
  }
  return io
}

