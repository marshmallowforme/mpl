const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Please provide a price"],
      min: [0, "Price must be positive"],
    },
    condition: {
      type: String,
      required: [true, "Please provide condition"],
      enum: {
        values: ["New", "Like New", "Good", "Acceptable", "For parts"],
        message: "Please select a valid condition",
      },
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, "Please provide a category"],
      enum: {
        values: ["Books", "Electronics", "Furniture", "Appliances", "Bicycles", "Clothing", "Other"],
        message: "Please select a valid category",
      },
    },
    subcategory: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide seller information"],
    },
    sellerName: {
      type: String,
      required: [true, "Please provide seller name"],
    },
    sellerPhone: {
      type: String,
      required: [true, "Please provide seller phone"],
    },
    sellerUniversity: {
      type: String,
      required: [true, "Please provide seller university"],
    },
    location: {
      type: String,
      required: [true, "Please provide location"],
    },
    pinCode: {
      type: String,
      required: [true, "Please provide pin code"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Add index for search
productSchema.index({ title: "text", description: "text", tags: "text" })
productSchema.index({ category: 1, subcategory: 1 })
productSchema.index({ pinCode: 1 })

const Product = mongoose.model("Product", productSchema)
module.exports = Product

