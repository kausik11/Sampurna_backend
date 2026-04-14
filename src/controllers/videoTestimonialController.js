const VideoTestimonial = require("../models/VideoTestimonial");
const cloudinary = require("../config/cloudinary");

const uploadImage = async (file) => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  const uploadResult = await cloudinary.uploader.upload(base64Image, {
    folder: "shampurna/video-testimonials",
    resource_type: "auto",
  });

  return {
    imageUrl: uploadResult.secure_url,
    imagePublicId: uploadResult.public_id,
  };
};

const normalizeText = (value) => `${value ?? ""}`.trim();

const getUploadedFile = (files, ...fieldNames) => {
  for (const fieldName of fieldNames) {
    const file = files?.[fieldName]?.[0];
    if (file) return file;
  }
  return null;
};

const getVideoLink = (body) => normalizeText(body.videoLink ?? body.videolink);

const getVideoTestimonials = async (_req, res) => {
  try {
    const testimonials = await VideoTestimonial.find().sort({ createdAt: -1 });
    return res.status(200).json(testimonials);
  } catch (error) {
    console.error("Failed to fetch video testimonials:", error);
    return res.status(500).json({ message: "Failed to fetch video testimonials" });
  }
};

const getVideoTestimonialById = async (req, res) => {
  try {
    const testimonial = await VideoTestimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: "Video testimonial not found" });
    }

    return res.status(200).json(testimonial);
  } catch (error) {
    console.error("Failed to fetch video testimonial:", error);
    return res.status(500).json({ message: "Failed to fetch video testimonial" });
  }
};

const createVideoTestimonial = async (req, res) => {
  try {
    const name = normalizeText(req.body.name);
    const message = normalizeText(req.body.message);
    const videoLink = getVideoLink(req.body);
    const imageFile = getUploadedFile(req.files, "image");
    const bannerImageFile = getUploadedFile(req.files, "bannerImage", "bannerimage");

    if (!name || !message || !videoLink) {
      return res.status(400).json({ message: "Name, message, and videoLink are required" });
    }

    if (!imageFile || !bannerImageFile) {
      return res.status(400).json({ message: "Image and banner image are required" });
    }

    const image = await uploadImage(imageFile);
    const bannerImage = await uploadImage(bannerImageFile);

    const testimonial = await VideoTestimonial.create({
      name,
      image: image.imageUrl,
      imagePublicId: image.imagePublicId,
      message,
      videoLink,
      bannerImage: bannerImage.imageUrl,
      bannerImagePublicId: bannerImage.imagePublicId,
    });

    return res.status(201).json(testimonial);
  } catch (error) {
    console.error("Failed to create video testimonial:", error);
    return res.status(500).json({ message: "Failed to create video testimonial" });
  }
};

const updateVideoTestimonial = async (req, res) => {
  try {
    const testimonial = await VideoTestimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: "Video testimonial not found" });
    }

    if (req.body.name !== undefined) {
      const name = normalizeText(req.body.name);
      if (!name) return res.status(400).json({ message: "Name cannot be empty" });
      testimonial.name = name;
    }

    if (req.body.message !== undefined) {
      const message = normalizeText(req.body.message);
      if (!message) return res.status(400).json({ message: "Message cannot be empty" });
      testimonial.message = message;
    }

    if (req.body.videoLink !== undefined || req.body.videolink !== undefined) {
      const videoLink = getVideoLink(req.body);
      if (!videoLink) return res.status(400).json({ message: "videoLink cannot be empty" });
      testimonial.videoLink = videoLink;
    }

    const imageFile = getUploadedFile(req.files, "image");
    if (imageFile) {
      const { imageUrl, imagePublicId } = await uploadImage(imageFile);

      if (testimonial.imagePublicId) {
        await cloudinary.uploader.destroy(testimonial.imagePublicId);
      }

      testimonial.image = imageUrl;
      testimonial.imagePublicId = imagePublicId;
    }

    const bannerImageFile = getUploadedFile(req.files, "bannerImage", "bannerimage");
    if (bannerImageFile) {
      const { imageUrl, imagePublicId } = await uploadImage(bannerImageFile);

      if (testimonial.bannerImagePublicId) {
        await cloudinary.uploader.destroy(testimonial.bannerImagePublicId);
      }

      testimonial.bannerImage = imageUrl;
      testimonial.bannerImagePublicId = imagePublicId;
    }

    await testimonial.save();
    return res.status(200).json(testimonial);
  } catch (error) {
    console.error("Failed to update video testimonial:", error);
    return res.status(500).json({ message: "Failed to update video testimonial" });
  }
};

const deleteVideoTestimonial = async (req, res) => {
  try {
    const testimonial = await VideoTestimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: "Video testimonial not found" });
    }

    if (testimonial.imagePublicId) {
      await cloudinary.uploader.destroy(testimonial.imagePublicId);
    }

    if (testimonial.bannerImagePublicId) {
      await cloudinary.uploader.destroy(testimonial.bannerImagePublicId);
    }

    await testimonial.deleteOne();
    return res.status(200).json({ message: "Video testimonial deleted" });
  } catch (error) {
    console.error("Failed to delete video testimonial:", error);
    return res.status(500).json({ message: "Failed to delete video testimonial" });
  }
};

module.exports = {
  getVideoTestimonials,
  getVideoTestimonialById,
  createVideoTestimonial,
  updateVideoTestimonial,
  deleteVideoTestimonial,
};
