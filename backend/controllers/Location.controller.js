const Product = require("../models/Product.model")
const User = require("../models/User.model")
const { createError } = require("../utils/errorUtil")
const axios = require("axios")
const config = require("../config/config")

/**
 * Get nearby products
 * @route GET /api/location/nearby
 * @access Public
 */
exports.getNearbyProducts = async (req, res, next) => {
  try {
    const {
      longitude,
      latitude,
      distance = 10, // in kilometers
      page = 1,
      limit = 10,
    } = req.query

    if (!longitude || !latitude) {
      return next(createError(400, "Longitude and latitude are required"))
    }

    // Calculate pagination
    const pageNum = Number.parseInt(page, 10)
    const limitNum = Number.parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Find products within the specified distance
    const products = await Product.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
          },
          $maxDistance: Number.parseInt(distance, 10) * 1000, // convert to meters
        },
      },
      isAvailable: true,
    })
      .skip(skip)
      .limit(limitNum)
      .populate("seller", "name profileImage")
      .populate("category", "name slug")

    // Get total count for pagination
    const total = await Product.countDocuments({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
          },
          $maxDistance: Number.parseInt(distance, 10) * 1000,
        },
      },
      isAvailable: true,
    })

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Geocode address to coordinates
 * @route POST /api/location/geocode
 * @access Public
 */
exports.geocodeAddress = async (req, res, next) => {
  try {
    const { address } = req.body

    if (!address) {
      return next(createError(400, "Address is required"))
    }

    // Use Google Maps Geocoding API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.GOOGLE_MAPS_API_KEY}`,
    )

    if (response.data.status !== "OK") {
      return next(createError(400, "Could not geocode address"))
    }

    const { lat, lng } = response.data.results[0].geometry.location
    const formattedAddress = response.data.results[0].formatted_address

    res.status(200).json({
      success: true,
      data: {
        coordinates: [lng, lat],
        address: formattedAddress,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update user's location
 * @route PUT /api/location/user
 * @access Private
 */
exports.updateUserLocation = async (req, res, next) => {
  try {
    const { coordinates, address } = req.body

    if (!coordinates || !address) {
      return next(createError(400, "Coordinates and address are required"))
    }

    // Update user's location
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        location: {
          type: "Point",
          coordinates,
          address,
        },
      },
      { new: true },
    ).select("-password")

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Search products by location
 * @route GET /api/location/search
 * @access Public
 */
exports.searchByLocation = async (req, res, next) => {
  try {
    const {
      address,
      distance = 10, // in kilometers
      category,
      minPrice,
      maxPrice,
      condition,
      page = 1,
      limit = 10,
    } = req.query

    if (!address) {
      return next(createError(400, "Address is required"))
    }

    // Geocode address
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.GOOGLE_MAPS_API_KEY}`,
    )

    if (response.data.status !== "OK") {
      return next(createError(400, "Could not geocode address"))
    }

    const { lat, lng } = response.data.results[0].geometry.location

    // Build query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: Number.parseInt(distance, 10) * 1000, // convert to meters
        },
      },
      isAvailable: true,
    }

    // Add filters
    if (category) {
      query.category = category
    }

    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }

    if (condition) {
      query.condition = condition
    }

    // Calculate pagination
    const pageNum = Number.parseInt(page, 10)
    const limitNum = Number.parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Find products
    const products = await Product.find(query)
      .skip(skip)
      .limit(limitNum)
      .populate("seller", "name profileImage")
      .populate("category", "name slug")

    // Get total count for pagination
    const total = await Product.countDocuments(query)

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
}

