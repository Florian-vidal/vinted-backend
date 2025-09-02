const express = require("express");
const router = express.Router(); 
const uid2 = require("uid2"); // Génère des chaînes aléatoires (utilisées pour salt et token)
const SHA256 = require("crypto-js/sha256"); // Algorithme de hashage sécurisé
const encBase64 = require("crypto-js/enc-base64"); // Encodage en base64 (lecture + stockage plus simple)

const User = require("../models/User.js");

// Route pour l'inscription
router.post("/user/signup", async (req, res) => {
  try {
    // Vérification que tous les champs obligatoires sont fournis
    if (
      !req.body.username ||
      !req.body.email ||
      !req.body.password ||
      !req.body.newsletter
    ) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    // Vérification si l’email existe déjà dans la BDD
    const existingMail = await User.findOne({ email: req.body.email });
    if (existingMail) {
      return res.status(400).json({ message: "Cet email est déjà pris" });
    }

    // Génération d’un "sel" unique pour sécuriser le hashage du mot de passe
    const salt = uid2(16);

    // Génération d’un token unique qui servira à authentifier l’utilisateur
    const token = uid2(32);

    // Hashage du mot de passe + sel
    const hash = SHA256(req.body.password + salt).toString(encBase64);

    // Création d’un nouvel utilisateur en base de données
    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
      },
      newsletter: req.body.newsletter, 
      salt: salt,
      token: token,
      hash: hash,
    });

    // Sauvegarde en BDD
    await newUser.save();

    // Réponse envoyée au client (⚠️ Ne jamais renvoyer le hash ou le salt !)
    const responseObj = {
      token: newUser.token,
      _id: newUser._id,
      account: {
        username: newUser.account.username,
      },
    };

    return res.status(201).json(responseObj);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Route pour la connexion
router.post("/user/login", async (req, res) => {
  try {
    // Recherche de l’utilisateur par email
    const foundUser = await User.findOne({ email: req.body.email });

    // Si l’email n’existe pas → accès refusé
    if (!foundUser) {
      return res.status(401).json("Non autorisé !");
    }

    // Recalcul du hash avec le mot de passe fourni et le sel stocké
    const newHash = SHA256(req.body.password + foundUser.salt).toString(
      encBase64
    );

    // Comparaison entre le hash recalculé et celui en base
    if (newHash === foundUser.hash) {
      // Authentification réussie → on renvoie les infos nécessaires
      const responseObj = {
        token: foundUser.token,
        _id: foundUser._id,
        account: {
          username: foundUser.account.username,
        },
      };
      return res.status(200).json(responseObj); 
    } else {
      return res.status(401).json({ message: "Non autorisé !" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
