const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    // Logique d'authentification :
    if (!req.headers.authorization) {
      return res.status(401).json("Unauthorized");
    }
    const token = req.headers.authorization.replace("Bearer ", ""); // espace derrière Bearer

    console.log(req.headers.authorization);

    // maintenant qu'on a le token, on peut rechercher à quel utilisateur il appartient en BDD :
    const user = await User.findOne({ token: token });
    if (user === null) {
      return res.status(401).json("Unauthorized");
    } else {
      // transmettre l'utilisateur trouvé à la route suivante :
      // on crée une clef dans l'objet req car c'est le meme objet que le "req" utilisé dans la route !
      req.user = user;
      // on oublie pas de passer à la suite :
      return next();
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
