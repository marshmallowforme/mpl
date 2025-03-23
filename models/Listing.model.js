const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  image: { type: String, required: true }
});

module.exports = mongoose.model('Listing', listingSchema);