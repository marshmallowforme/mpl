const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  meetupLocation: {
    name: {
      type: String,
      required: [true, 'Please provide a meetup location name']
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Please provide latitude']
      },
      lng: {
        type: Number,
        required: [true, 'Please provide longitude']
      }
    }
  },
  meetupTime: {
    type: Date,
    required: [true, 'Please provide a meetup time']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online'],
    default: 'cash'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);