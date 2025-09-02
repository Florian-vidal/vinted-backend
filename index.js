require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(
  cors({
    origin: ["http://localhost:5173", "https://vinted-florian-vidal.netlify.app"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

const User = require("./models/User");
const Offer = require("./models/Offer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api.ping((error, result) => {
  if (error) {
    console.error("Cloudinary non connecté :", error);
  } else {
    console.log("Cloudinary est bien connecté :", result);
  }
});

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur le site Vinted");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.post("/payment", async (req, res) => {
  try {
    const { amount, title } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Missing amount" });
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      description: title,
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ message: error.message });
  }
});

app.all(/.*/, (req, res) => {
  return res.status(404).json("Not found");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port : ${PORT} 🔥🔥🔥`);
});
