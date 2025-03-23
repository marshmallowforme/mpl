const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    university: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    location: {
      formatted: {
        type: String,
        default: "",
      },
      pinCode: {
        type: String,
        required: true,
      },
      address: {
        street: {
          type: String,
          default: "",
        },
        city: {
          type: String,
          default: "",
        },
        state: {
          type: String,
          default: "",
        },
        country: {
          type: String,
          default: "",
        },
      },
    },
  },
  { timestamps: true },
)

// Index pinCode field for searches
userSchema.index({ "location.pinCode": 1 })

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next()

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10)

    // Hash the password along with our new salt
    this.password = await bcrypt.hash(this.password, salt)

    next()
  } catch (error) {
    next(error)
  }
})

// 🔹 Compare password function
userSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    // Log for debugging (remove in production)
    console.log("Comparing passwords:")
    console.log("Entered:", enteredPassword)
    console.log("Stored Hash:", this.password)

    // Use bcrypt.compare correctly
    const isMatch = await bcrypt.compare(enteredPassword, this.password)
    console.log("Match result:", isMatch)
    return isMatch
  } catch (error) {
    console.error("Password comparison error:", error)
    return false
  }
}

const User = mongoose.model("User", userSchema)

module.exports = User

