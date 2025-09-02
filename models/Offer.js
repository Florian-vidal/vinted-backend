const mongoose = require("mongoose");

// Modèle Offer (Annonce / Produit)- Chaque offre correspond à un article mis en ligne par un utilisateur
const Offer = mongoose.model("Offer", {

  product_name: String,
  product_description: String,
  product_price: Number,

  // Tableau pour stocker des caractéristiques sous forme clé/valeur
  // ex: [{ MARQUE: "Zara" }, { TAILLE: "M" }, { ETAT: "Neuf" }]
  product_details: Array,

  // Objet pour stocker l'image (fourni par Cloudinary → contient url, id, etc.)
  product_image: Object,

  // Référence vers le propriétaire (utilisateur qui a créé l’offre)
  owner: {
    type: mongoose.Schema.Types.ObjectId, // Stocke l'ID MongoDB de l'utilisateur
    ref: "User", // Fait le lien avec la collection "User"
  },
});

module.exports = Offer;
