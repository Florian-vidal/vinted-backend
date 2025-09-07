// Chargement des variables d'environnement depuis un fichier .env
require("dotenv").config();

// Import des dépendances principales
const express = require("express"); // Framework Node.js pour créer un serveur HTTP
const mongoose = require("mongoose"); // Librairie pour interagir avec MongoDB
const cloudinary = require("cloudinary").v2; // Service de stockage d’images et vidéos
const cors = require("cors"); // Middleware pour gérer les requêtes cross-origin (front/back)
const app = express(); // Initialisation de l'application Express
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Intégration de l'API Stripe (paiements)

// Autoriser ton frontend Netlify
app.use(cors({
  origin: "https://tedvin-florian-vidal.netlify.app"
}));

// Middleware pour parser les données JSON dans le body des requêtes
app.use(express.json());

// Connexion à MongoDB via Mongoose (URI dans le fichier .env)
mongoose.connect(process.env.MONGODB_URI);

// Import des modèles (schémas MongoDB)
const User = require("./models/User");
const Offer = require("./models/Offer");

// Configuration de Cloudinary avec les clés API
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Vérification de la connexion à Cloudinary
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error("Cloudinary non connecté :", error);
  } else {
    console.log("Cloudinary est bien connecté :", result);
  }
});

// Route de base (root) pour tester le serveur
app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur le site Vinted");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Import des routes personnalisées
const userRoutes = require("./routes/user");
app.use(userRoutes); // Routes liées aux utilisateurs

const offerRoutes = require("./routes/offer");
app.use(offerRoutes); // Routes liées aux offres

// Route de paiement Stripe
app.post("/payment", async (req, res) => {
  try {
    const { amount, title } = req.body;

    // Vérification que le montant est bien envoyé
    if (!amount) {
      return res.status(400).json({ message: "Missing amount" });
    }

    // Création d’une intention de paiement Stripe
    const intent = await stripe.paymentIntents.create({
      amount, // Montant en centimes
      currency: "eur", // Devise
      description: title, // Description de la transaction
    });

    // Envoi du client_secret au frontend pour finaliser le paiement
    res.json({ clientSecret: intent.client_secret });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Middleware pour gérer toutes les routes non trouvées (404)
app.all(/.*/, (req, res) => {
  return res.status(404).json("Not found");
});

// Définition du port (par défaut 3000 si non spécifié dans .env)
const PORT = process.env.PORT || 3000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Server started on port : ${PORT} 🔥🔥🔥`);
});
