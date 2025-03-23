const Category = require('../models/Category.model');
const { createError } = require('../utils/errorUtil');
const slugify = require('slugify');

/**
 * Get all categories
 * @route GET /api/categories
 * @access Public
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate('subcategories')
      .populate('productCount');

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 * @access Public
 */
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('subcategories')
      .populate('productCount');

    if (!category) {
      return next(createError(404, 'Category not found'));
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category
 * @route POST /api/categories
 * @access Private (Admin)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, parent } = req.body;

    // Create slug from name
    const slug = slugify(name, { lower: true });

    // Check if category with same slug exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return next(createError(400, 'Category with this name already exists'));
    }

    // Create category
    const category = new Category({
      name,
      slug,
      description,
      icon,
      parent
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * @route PUT /api/categories/:id
 * @access Private (Admin)
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, parent } = req.body;

    // If name is provided, create new slug
    let slug;
    if (name) {
      slug = slugify(name, { lower: true });

      // Check if category with same slug exists (excluding current category)
      const existingCategory = await Category.findOne({ 
        slug,
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return next(createError(400, 'Category with this name already exists'));
      }
    }

    // Update category
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        slug, 
        description, 
        icon, 
        parent 
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return next(createError(404, 'Category not found'));
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 * @route DELETE /api/categories/:id
 * @access Private (Admin)
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(createError(404, 'Category not found'));
    }

    // Check if category has subcategories
    const subcategories = await Category.find({ parent: req.params.id });
    if (subcategories.length > 0) {
      return next(createError(400, 'Cannot delete category with subcategories'));
    }

    await category.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};