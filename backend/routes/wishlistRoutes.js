const express = require('express');
const router = express.Router();
const { 
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist
} = require('../controllers/Wishlist.controller');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/', getWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/check/:productId', checkWishlist);
router.delete('/', clearWishlist);

module.exports = router;