const Gallery = require("../models/Gallery");
const cloudinary = require("../config/cloudinary");

const uploadImage = async (file) => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  const uploadResult = await cloudinary.uploader.upload(base64Image, {
    folder: "shampurna/gallery",
    resource_type: "auto",
  });

  return {
    imageUrl: uploadResult.secure_url,
    imagePublicId: uploadResult.public_id,
  };
};

const normalizeText = (value) => `${value ?? ""}`.trim();

const getGalleryItems = async (req, res) => {
  try {
    const tag = normalizeText(req.query.tag);
    const filter = tag ? { tag } : {};
    const items = await Gallery.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(items);
  } catch (error) {
    console.error("Failed to fetch gallery items:", error);
    return res.status(500).json({ message: "Failed to fetch gallery items" });
  }
};

const getGalleryItemById = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error("Failed to fetch gallery item:", error);
    return res.status(500).json({ message: "Failed to fetch gallery item" });
  }
};

const createGalleryItem = async (req, res) => {
  try {
    const tag = normalizeText(req.body.tag);
    const title = normalizeText(req.body.title);
    const description = normalizeText(req.body.description);

    if (!tag || !title || !description) {
      return res.status(400).json({ message: "Tag, title, and description are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const { imageUrl, imagePublicId } = await uploadImage(req.file);
    const item = await Gallery.create({
      tag,
      title,
      description,
      image: imageUrl,
      imagePublicId,
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error("Failed to create gallery item:", error);
    return res.status(500).json({ message: "Failed to create gallery item" });
  }
};

const updateGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    if (req.body.tag !== undefined) {
      const tag = normalizeText(req.body.tag);
      if (!tag) return res.status(400).json({ message: "Tag cannot be empty" });
      item.tag = tag;
    }

    if (req.body.title !== undefined) {
      const title = normalizeText(req.body.title);
      if (!title) return res.status(400).json({ message: "Title cannot be empty" });
      item.title = title;
    }

    if (req.body.description !== undefined) {
      const description = normalizeText(req.body.description);
      if (!description) return res.status(400).json({ message: "Description cannot be empty" });
      item.description = description;
    }

    if (req.file) {
      const { imageUrl, imagePublicId } = await uploadImage(req.file);

      if (item.imagePublicId) {
        await cloudinary.uploader.destroy(item.imagePublicId);
      }

      item.image = imageUrl;
      item.imagePublicId = imagePublicId;
    }

    await item.save();
    return res.status(200).json(item);
  } catch (error) {
    console.error("Failed to update gallery item:", error);
    return res.status(500).json({ message: "Failed to update gallery item" });
  }
};

const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    if (item.imagePublicId) {
      await cloudinary.uploader.destroy(item.imagePublicId);
    }

    await item.deleteOne();
    return res.status(200).json({ message: "Gallery item deleted" });
  } catch (error) {
    console.error("Failed to delete gallery item:", error);
    return res.status(500).json({ message: "Failed to delete gallery item" });
  }
};

module.exports = {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
};
