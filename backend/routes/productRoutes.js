const express = require("express")
const router = express.Router()
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getMyProducts,
  getRelatedProducts,
} = require("../controllers/Product.controller")
const { protect } = require("../middleware/authMiddleware")
const Product = require("../models/Product.model");

// POST: Add a new product
router.post("/", async (req, res) => {
  try {
    const { title, category, price, description, location, condition, tags, photos, negotiable } = req.body;
    console.log("data received : ",{ title, category, price, description, location, condition, tags, photos, negotiable })

    if (!title || !category || !price || !location) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    const newProduct = await Product.create({
      title,
      category,  // Ensure category is stored properly
       price,
      description,
      location,
      condition,
      tags,
      images :photos,
      negotiable,
      datePosted: new Date(),
      isAvailable: true,
    });
    if(!newProduct){
      return res.status(400).json({ message: "Failed to create product" });
    }
    res.status(201).json({message : "Product created successfully", data : newProduct});
  } catch (error) {
    res.status(500).json({ message: "Error saving product", error });
  }
});



// Public routes
router.get("/", getProducts)
router.get("/seller/:id", getSellerProducts)
router.get("/:id/related", getRelatedProducts)
router.get("/:id", getProduct)

// Protected routes
router.post("/", protect, createProduct)
router.put("/:id", protect, updateProduct)
router.delete("/:id", protect, deleteProduct)
router.get("/my-products", protect, getMyProducts)

module.exports = router;

