const Product = require('../models/Product.model');
const { createError } = require('../utils/errorUtil');
const { geocodeAddress } = require('../utils/locationUtil');

/**
 * Create a new product
 * @route POST /api/products
 * @access Private
 */
const createProduct = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      price, 
      category, 
      condition, 
      images, 
      location,
      tags,
      lat,
      lng,
      address
    } = req.body;

    const product = new Product({
      title,
      description,
      price,
      category,
      condition,
      images,
      location,
      tags,
      seller: req.user.id
    });

    if (lat && lng) {
      product.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
      if (address) product.address = address;
    } else if (location) {
      try {
        const coords = await geocodeAddress(location);
        product.coordinates = {
          type: 'Point',
          coordinates: [coords.lng, coords.lat]
        };
      } catch (error) {
        console.error('Geocoding failed:', error);
      }
    }

    await product.save();

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products with filtering, sorting, and pagination
 * @route GET /api/products
 * @access Public
 */
const getProducts = async (req, res, next) => {
  try {
    const { 
      category, 
      condition, 
      minPrice, 
      maxPrice, 
      search,
      location,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    filter.isAvailable = true;
    filter.isSold = false;

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('seller', 'name profileImage rating')
      .populate('category', 'name slug');

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: { products, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single product by ID
 * @route GET /api/products/:id
 * @access Public
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name profileImage rating')
      .populate('category', 'name slug');

    if (!product) {
      return next(createError(404, 'Product not found'));
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a product
 * @route PUT /api/products/:id
 * @access Private
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(createError(404, 'Product not found'));
    if (product.seller.toString() !== req.user.id) return next(createError(403, 'Not authorized to update this product'));

    const updates = req.body;
    Object.keys(updates).forEach((key) => (product[key] = updates[key]));
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a product
 * @route DELETE /api/products/:id
 * @access Private
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(createError(404, 'Product not found'));
    if (product.seller.toString() !== req.user.id) return next(createError(403, 'Not authorized to delete this product'));
    await product.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by seller ID
 * @route GET /api/products/seller/:id
 * @access Public
 */
const getSellerProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.params.id, isAvailable: true, isSold: false })
      .populate('seller', 'name profileImage rating')
      .populate('category', 'name slug');

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products for the logged-in seller
 * @route GET /api/products/my-products
 * @access Private
 */
const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .populate('seller', 'name profileImage rating')
      .populate('category', 'name slug');

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const getRelatedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .populate('seller', 'name profileImage rating')
      .populate('category', 'name slug');

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// Export all functions
module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getMyProducts,
  getRelatedProducts
};