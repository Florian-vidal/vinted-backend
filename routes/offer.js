const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const convertToBase64 = require("../utils/convertBase64");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");

const Offer = require("../models/Offer");

// Route publish
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, brand, size, condition, color, city } =
        req.body;

      if (!title || !price) {
        return res
          .status(400)
          .json({ message: "Merci de fournir un titre et un prix" });
      }

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
        owner: req.user,
      });

      if (req.files?.picture) {
        const convertedPicture = convertToBase64(req.files.picture);
        const uploadResponse = await cloudinary.uploader.upload(convertedPicture);
        newOffer.product_image = uploadResponse;
      }

      await newOffer.save();
      return res.status(201).json(newOffer);
    } catch (error) {
      console.error("Erreur /offer/publish:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// Liste des offres
router.get("/offers", async (req, res) => {
  try {
    let skip = 0;
    let limit = 10;
    const filters = {};

    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMax) {
      filters.product_price = { $lte: Number(req.query.priceMax) };
    }
    if (req.query.priceMin) {
      filters.product_price = {
        ...filters.product_price,
        $gte: Number(req.query.priceMin),
      };
    }

    const sortedObject = {};
    if (req.query.sort) {
      sortedObject.product_price = req.query.sort.replace("price-", "");
    }
    if (req.query.page) {
      skip = (req.query.page - 1) * limit;
    }

    const offers = await Offer.find(filters)
      .populate("owner", "account")
      .sort(sortedObject)
      .limit(limit)
      .skip(skip);

    return res.status(200).json(offers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Détail d’une offre
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
