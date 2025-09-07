const express = require("express");
const router = express.Router(); 
const fileUpload = require("express-fileupload"); // Middleware pour gérer l’upload de fichiers
const convertToBase64 = require("../utils/convertBase64"); // Fonction utilitaire pour convertir une image en Base64
const cloudinary = require("cloudinary").v2; // Service de stockage d’images
const isAuthenticated = require("../middlewares/isAuthenticated"); // Middleware d’authentification

const Offer = require("../models/Offer");

// Route pour la création d'offre en ligne
router.post(
  "/offer/publish",
  isAuthenticated, // Vérifie le token de l’utilisateur
  fileUpload(), // Active la gestion de fichiers
  async (req, res) => {
    try {
      const { title, description, price, brand, size, condition, color, city } =
        req.body;

      // Vérification des champs obligatoires
      if (!title || !price) {
        return res
          .status(400)
          .json({ message: "Merci de fournir un titre et un prix" });
      }

      // Création de l’objet Offer
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        owner: req.user, // récupéré depuis le middleware isAuthenticated
      });

      // Gestion de l’image → upload vers Cloudinary
      if (req.files?.picture) {
        const convertedPicture = convertToBase64(req.files.picture);
        const uploadResponse = await cloudinary.uploader.upload(convertedPicture);
        newOffer.product_image = uploadResponse; // on stocke directement l’objet Cloudinary
      }

      // Sauvegarde en BDD
      await newOffer.save();
      return res.status(201).json(newOffer); 
    } catch (error) {
      console.error("Erreur /offer/publish:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// Route pour afficher les offres
router.get("/offers", async (req, res) => {
  try {
    let skip = 0; // nombre d’éléments à sauter (pagination)
    let limit = 10; // nombre max d’offres renvoyées
    const filters = {}; // objet qui regroupera les conditions MongoDB

    // Filtre par titre 
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    // Filtre par prix maximum
    if (req.query.priceMax) {
      filters.product_price = { $lte: Number(req.query.priceMax) };
    }

    // Filtre par prix minimum (fusionné si un max existe déjà)
    if (req.query.priceMin) {
      filters.product_price = {
        ...filters.product_price,
        $gte: Number(req.query.priceMin),
      };
    }

    // Tri des résultats (asc ou desc)
    const sortedObject = {};
    if (req.query.sort) {
      sortedObject.product_price = req.query.sort.replace("price-", "");
    }

    // Pagination → calcule combien d’offres sauter
    if (req.query.page) {
      skip = (req.query.page - 1) * limit;
    }

    // Requête MongoDB → avec filtres, tri, limite, pagination
    const offers = await Offer.find(filters)
      .populate("owner", "account") // Remplace l’ID du propriétaire par ses infos (username, avatar…)
      .sort(sortedObject)
      .limit(limit)
      .skip(skip);

    return res.status(200).json(offers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Route pour afficher le détail d'une route
router.get("/offers/:id", async (req, res) => {
  try {
    const offerDetails = await Offer.findById(req.params.id).populate("owner");

    if (offerDetails) {
      return res.status(200).json(offerDetails);
    } else {
      return res.status(400).json({ message: "This ID doesn't exist" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
