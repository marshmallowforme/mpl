const express = require("express");
const router = express.Router();
// Fix the path to use the correct model file name
const Category = require("../models/Category.model");

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get category by slug
router.get("/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;