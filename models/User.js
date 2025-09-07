const mongoose = require("mongoose");

// Modèle User (Utilisateur) - Chaque utilisateur correspond à un compte avec email, mot de passe sécurisé
// et un token d’authentification

const User = mongoose.model("User", {
  email: String,

  // Informations liées au profil utilisateur
  account: {
    username: String,
    avatar: Object,
  },

  newsletter: Boolean,

  // Token unique généré à la création du compte → sert pour l’authentification
  token: String,

  // Hash du mot de passe (calculé avec SHA256 + salt)
  hash: String,

  // Sel utilisé pour renforcer la sécurité du hash
  salt: String,
});

module.exports = User;
