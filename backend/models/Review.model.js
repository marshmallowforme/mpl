const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
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
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    required: [true, 'Please provide a comment'],
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent user from submitting more than one review per product
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to calculate average rating
ReviewSchema.statics.getAverageRating = async function(sellerId) {
  const obj = await this.aggregate([
    {
      $match: { seller: sellerId }
    },
    {
      $group: {
        _id: '$seller',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  
  try {
    if (obj[0]) {
      await this.model('User').findByIdAndUpdate(sellerId, {
        rating: obj[0].averageRating.toFixed(1),
        reviewCount: obj[0].reviewCount
      });
    } else {
      await this.model('User').findByIdAndUpdate(sellerId, {
        rating: 0,
        reviewCount: 0
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.seller);
});

// Call getAverageRating after remove
ReviewSchema.post('remove', function() {
  this.constructor.getAverageRating(this.seller);
});

module.exports = mongoose.model('Review', ReviewSchema);