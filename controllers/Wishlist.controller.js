const Wishlist = require('../models/Wishlist.model');
const { createError } = require('../utils/errorUtil');

/**
 * Get user's wishlist
 * @route GET /api/wishlist
 * @access Private
 */
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: 'products',
        populate: {
          path: 'seller',
          select: 'name profileImage'
        }
      });

    // If no wishlist exists, create one
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add product to wishlist
 * @route POST /api/wishlist/:productId
 * @access Private
 */
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    // If no wishlist exists, create one
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [productId] });
    } else {
      // Check if product is already in wishlist
      if (wishlist.products.includes(productId)) {
        return next(createError(400, 'Product already in wishlist'));
      }

      // Add product to wishlist
      wishlist.products.push(productId);
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove product from wishlist
 * @route DELETE /api/wishlist/:productId
 * @access Private
 */
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return next(createError(404, 'Wishlist not found'));
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      product => product.toString() !== productId
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if product is in wishlist
 * @route GET /api/wishlist/check/:productId
 * @access Private
 */
exports.checkWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: {
          isInWishlist: false
        }
      });
    }

    const isInWishlist = wishlist.products.includes(productId);

    res.status(200).json({
      success: true,
      data: {
        isInWishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear wishlist
 * @route DELETE /api/wishlist
 * @access Private
 */
exports.clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return next(createError(404, 'Wishlist not found'));
    }

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};