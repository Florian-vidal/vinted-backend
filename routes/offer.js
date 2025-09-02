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
          .json({ message: "Merci de fournir au minimum un titre et un prix" });
      }

      // Création de l'offre
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

      // Gestion de l'image si fournie
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
