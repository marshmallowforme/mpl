const dotenv = require('dotenv').config({ path: './.env' });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');
const mongoURI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const messageRoutes = require("./routes/messageRoutes");
const locationRoutes = require("./routes/locationRoutes");
const { errorHandler } = require("./middleware/errorMiddleware.js");
const Product = require("./models/Product.model.js");
const Wishlist = require("./models/Wishlist.model.js");

// Initialize express app
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debugging: Check if environment variables are loaded
console.log("✅ Checking Environment Variables:");
console.log("MONGO_URI:", process.env.MONGODB_URI);
console.log("PORT:", process.env.PORT);

// ✅ Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// ✅ Define Static Data for States and Cities
const statesAndCities = {
  Maharashtra: ["Mumbai", "Pune", "Nagpur"],
  Karnataka: ["Bangalore", "Mysore"],
  Delhi: ["New Delhi"],
};

// ✅ Get all states and cities
app.get("/api/states", (req, res) => {
  res.json(statesAndCities);
});

// ✅ Get all products with filters
app.get("/api/products", async (req, res) => {
  const { state, city, sort } = req.query;
  let filter = {};

  if (state) filter.location = new RegExp(state, "i");
  if (city) filter.location = new RegExp(city, "i");

  let query = Product.find(filter);
  if (sort === "price-low") query = query.sort({ price: 1 });
  if (sort === "price-high") query = query.sort({ price: -1 });

  const products = await query.exec();
  res.json(products);
});

// ✅ Add to Wishlist
app.post("/api/wishlist", async (req, res) => {
  const { userId, productId } = req.body;
  const existing = await Wishlist.findOne({ userId, productId });
  if (existing)
    return res.status(400).json({ message: "Already in wishlist" });

  await Wishlist.create({ userId, productId });
  res.json({ message: "Added to wishlist" });
});

// ✅ Get Wishlist Items
app.get("/api/wishlist/:userId", async (req, res) => {
  const wishlistItems = await Wishlist.find({ userId: req.params.userId });
  res.json(wishlistItems);
});

// ✅ Remove from Wishlist
app.delete("/api/wishlist", async (req, res) => {
  const { userId, productId } = req.body;
  await Wishlist.deleteOne({ userId, productId });
  res.json({ message: "Removed from wishlist" });
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/location", locationRoutes);

// ✅ Error Handling Middleware
app.use(errorHandler);

// ✅ Socket.IO Setup
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('send_message', (data) => {
    // Handle the message and emit it to the room
    io.to(data.conversationId).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('user_typing', data);
  });

});

// ✅ Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
