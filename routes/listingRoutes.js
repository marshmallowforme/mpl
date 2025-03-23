const express = require('express');
const Listing = require('../models/Listing.model');
const router = express.Router();

// Get all listings
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find();
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;