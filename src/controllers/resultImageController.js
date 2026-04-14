const ResultImage = require("../models/ResultImage");
const { RESULT_IMAGE_TAGS } = require("../models/ResultImage");
const cloudinary = require("../config/cloudinary");

const uploadImage = async (file) => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  const uploadResult = await cloudinary.uploader.upload(base64Image, {
    folder: "shampurna/result-images",
    resource_type: "auto",
  });

  return {
    imageUrl: uploadResult.secure_url,
    imagePublicId: uploadResult.public_id,
  };
};

const normalizeText = (value) => `${value ?? ""}`.trim().replace(/\s+/g, " ");

const getUploadedFile = (files, ...fieldNames) => {
  for (const fieldName of fieldNames) {
    const file = files?.[fieldName]?.[0];
    if (file) return file;
  }
  return null;
};

const isValidTag = (tag) => RESULT_IMAGE_TAGS.includes(tag);

const invalidTagMessage = `Tag must be one of: ${RESULT_IMAGE_TAGS.join(", ")}`;

const getResultImages = async (req, res) => {
  try {
    const tag = normalizeText(req.query.tag);
    const filter = {};

    if (tag) {
      if (!isValidTag(tag)) {
        return res.status(400).json({ message: invalidTagMessage });
      }
      filter.tag = tag;
    }

    const resultImages = await ResultImage.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(resultImages);
  } catch (error) {
    console.error("Failed to fetch result images:", error);
    return res.status(500).json({ message: "Failed to fetch result images" });
  }
};

const getResultImageById = async (req, res) => {
  try {
    const resultImage = await ResultImage.findById(req.params.id);

    if (!resultImage) {
      return res.status(404).json({ message: "Result image not found" });
    }

    return res.status(200).json(resultImage);
  } catch (error) {
    console.error("Failed to fetch result image:", error);
    return res.status(500).json({ message: "Failed to fetch result image" });
  }
};

const createResultImage = async (req, res) => {
  try {
    const tag = normalizeText(req.body.tag);
    const beforeImageFile = getUploadedFile(req.files, "beforeimage", "beforeImage");
    const afterImageFile = getUploadedFile(req.files, "afterimage", "afterImage");

    if (!tag) {
      return res.status(400).json({ message: "Tag is required" });
    }

    if (!isValidTag(tag)) {
      return res.status(400).json({ message: invalidTagMessage });
    }

    if (!beforeImageFile || !afterImageFile) {
      return res.status(400).json({ message: "Before and after images are required" });
    }

    const beforeImage = await uploadImage(beforeImageFile);
    const afterImage = await uploadImage(afterImageFile);

    const resultImage = await ResultImage.create({
      tag,
      beforeimage: beforeImage.imageUrl,
      beforeimagePublicId: beforeImage.imagePublicId,
      afterimage: afterImage.imageUrl,
      afterimagePublicId: afterImage.imagePublicId,
    });

    return res.status(201).json(resultImage);
  } catch (error) {
    console.error("Failed to create result image:", error);
    return res.status(500).json({ message: "Failed to create result image" });
  }
};

const updateResultImage = async (req, res) => {
  try {
    const resultImage = await ResultImage.findById(req.params.id);

    if (!resultImage) {
      return res.status(404).json({ message: "Result image not found" });
    }

    if (req.body.tag !== undefined) {
      const tag = normalizeText(req.body.tag);
      if (!tag) return res.status(400).json({ message: "Tag cannot be empty" });
      if (!isValidTag(tag)) return res.status(400).json({ message: invalidTagMessage });
      resultImage.tag = tag;
    }

    const beforeImageFile = getUploadedFile(req.files, "beforeimage", "beforeImage");
    if (beforeImageFile) {
      const { imageUrl, imagePublicId } = await uploadImage(beforeImageFile);

      if (resultImage.beforeimagePublicId) {
        await cloudinary.uploader.destroy(resultImage.beforeimagePublicId);
      }

      resultImage.beforeimage = imageUrl;
      resultImage.beforeimagePublicId = imagePublicId;
    }

    const afterImageFile = getUploadedFile(req.files, "afterimage", "afterImage");
    if (afterImageFile) {
      const { imageUrl, imagePublicId } = await uploadImage(afterImageFile);

      if (resultImage.afterimagePublicId) {
        await cloudinary.uploader.destroy(resultImage.afterimagePublicId);
      }

      resultImage.afterimage = imageUrl;
      resultImage.afterimagePublicId = imagePublicId;
    }

    await resultImage.save();
    return res.status(200).json(resultImage);
  } catch (error) {
    console.error("Failed to update result image:", error);
    return res.status(500).json({ message: "Failed to update result image" });
  }
};

const deleteResultImage = async (req, res) => {
  try {
    const resultImage = await ResultImage.findById(req.params.id);

    if (!resultImage) {
      return res.status(404).json({ message: "Result image not found" });
    }

    if (resultImage.beforeimagePublicId) {
      await cloudinary.uploader.destroy(resultImage.beforeimagePublicId);
    }

    if (resultImage.afterimagePublicId) {
      await cloudinary.uploader.destroy(resultImage.afterimagePublicId);
    }

    await resultImage.deleteOne();
    return res.status(200).json({ message: "Result image deleted" });
  } catch (error) {
    console.error("Failed to delete result image:", error);
    return res.status(500).json({ message: "Failed to delete result image" });
  }
};

const getResultImageTags = (_req, res) => {
  return res.status(200).json(RESULT_IMAGE_TAGS);
};

module.exports = {
  getResultImages,
  getResultImageById,
  createResultImage,
  updateResultImage,
  deleteResultImage,
  getResultImageTags,
};
