// This file would be part of a Node.js/Express backend
// In a real application, this would be implemented in a secure backend environment

const express = require("express")
const router = express.Router()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const { Transaction, Product, User } = require("../models")

/**
 * Create a payment intent with Stripe
 */
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "inr", metadata } = req.body

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in smallest currency unit (paise for INR)
      currency,
      metadata,
      payment_method_types: ["card"],
    })

    // Return the client secret to the client
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    res.status(500).json({ error: error.message })
  }
});

/**
 * Confirm a payment with Stripe
 */
router.post("/confirm-payment/:paymentIntentId", async (req, res) => {
  try {
    const { paymentIntentId } = req.params
    const { paymentMethod } = req.body

    // Confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod.id,
    })

    // Create a transaction record in the database
    const transaction = await Transaction.create({
      amount: paymentIntent.amount / 100,
      paymentId: paymentIntent.id,
      status: paymentIntent.status,
      productId: paymentIntent.metadata.productId,
      buyerId: req.user.id, // Assuming authentication middleware sets req.user
      sellerId: paymentIntent.metadata.sellerId,
    })

    // Update product status to sold
    await Product.findByIdAndUpdate(paymentIntent.metadata.productId, {
      status: "Sold",
    })

    res.json({
      success: true,
      transaction,
      paymentIntent,
    })
  } catch (error) {
    console.error("Error confirming payment:", error)
    res.status(500).json({ error: error.message })
  }
});

/**
 * Process a UPI payment
 */
router.post("/process-upi", async (req, res) => {
  try {
    const { upiId, amount, productId, sellerId } = req.body

    // In a real app, you would integrate with a UPI payment gateway
    // For demonstration purposes, we'll simulate a successful payment

    // Create a transaction record in the database
    const transaction = await Transaction.create({
      amount,
      paymentMethod: "UPI",
      paymentId: `UPI_${Date.now()}`,
      status: "Pending", // UPI payments typically start as pending
      productId,
      buyerId: req.user.id, // Assuming authentication middleware sets req.user
      sellerId,
    })

    // Update product status to reserved
    await Product.findByIdAndUpdate(productId, {
      status: "Reserved",
    })

    res.json({
      success: true,
      transaction,
      upiPaymentLink: `upi://pay?pa=${upiId}&pn=StudentMarketplace&am=${amount}&cu=INR&tn=Payment for product ${productId}`,
    })
  } catch (error) {
    console.error("Error processing UPI payment:", error)
    res.status(500).json({ error: error.message })
  }
});

/**
 * Webhook to handle Stripe events
 */
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"]
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object
      // Update transaction status in the database
      await Transaction.findOneAndUpdate({ paymentId: paymentIntent.id }, { status: "Completed" })
      break

    case "payment_intent.payment_failed":
      const failedPaymentIntent = event.data.object
      // Update transaction status in the database
      await Transaction.findOneAndUpdate({ paymentId: failedPaymentIntent.id }, { status: "Failed" })
      // Update product status back to available
      if (failedPaymentIntent.metadata.productId) {
        await Product.findByIdAndUpdate(failedPaymentIntent.metadata.productId, {
          status: "Available",
        })
      }
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({ received: true })
})

/**
 * Get payment history for a user
 */
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    // Ensure the user can only access their own payment history
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    // Get all transactions where the user is either the buyer or seller
    const transactions = await Transaction.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate("productId")
      .populate("buyerId", "name email avatar")
      .populate("sellerId", "name email avatar")
      .sort({ createdAt: -1 })

    res.json(transactions)
  } catch (error) {
    console.error("Error fetching payment history:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router;

