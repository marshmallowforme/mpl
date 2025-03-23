const express = require("express")
const router = express.Router()
const {
  getNearbyProducts,
  geocodeAddress,
  updateUserLocation,
  searchByLocation,
} = require("../controllers/Location.controller")
const { protect, optionalAuth } = require("../middleware/authMiddleware")

// Public routes
router.get("/nearby", getNearbyProducts)
router.post("/geocode", geocodeAddress)
router.get("/search", searchByLocation)

// Protected routes
router.put("/user", protect, updateUserLocation)

module.exports = router

