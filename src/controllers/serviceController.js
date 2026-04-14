const Service = require("../models/Service");
const cloudinary = require("../config/cloudinary");

const uploadImage = async (file, folder = "shampurna/services") => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  const uploadResult = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: "auto",
  });

  return {
    imageUrl: uploadResult.secure_url,
    imagePublicId: uploadResult.public_id,
  };
};

const parseJSON = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }
  return fallback;
};

const getUploadedFile = (files, ...fieldNames) => {
  for (const fieldName of fieldNames) {
    const file = files?.[fieldName]?.[0];
    if (file) return file;
  }
  return null;
};

const normalizeText = (value) => `${value ?? ""}`.trim();

const normalizeResultPayload = (body) => {
  const result = parseJSON(body.result, {});
  return {
    title: normalizeText(result.title ?? body.resultTitle),
    description: normalizeText(result.description ?? body.resultDescription),
  };
};

const normalizeFaqsPayload = (body) => {
  const parsedFaqs = parseJSON(body.faqs, null);
  const parsedFaq = parseJSON(body.faq, null);
  const source = Array.isArray(parsedFaqs)
    ? parsedFaqs
    : Array.isArray(parsedFaq)
      ? parsedFaq
      : [parsedFaq ?? { question: body.faqQuestion, answer: body.faqAnswer }];

  return source
    .map((faq) => ({
      question: normalizeText(faq?.question),
      answer: normalizeText(faq?.answer),
    }))
    .filter((faq) => faq.question || faq.answer);
};

const getServices = async (_req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    console.error("Failed to fetch services:", error);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(service);
  } catch (error) {
    console.error("Failed to fetch service:", error);
    res.status(500).json({ message: "Failed to fetch service" });
  }
};

const createService = async (req, res) => {
  try {
    const title = normalizeText(req.body.title);
    const shortDescription = normalizeText(req.body.shortDescription);
    const tag = normalizeText(req.body.tag);
    const longdescription = normalizeText(req.body.longdescription);
    const resultPayload = normalizeResultPayload(req.body);
    const faqs = normalizeFaqsPayload(req.body);
    const beforeImageFile = getUploadedFile(req.files, "beforeimage", "beforeImage");
    const afterImageFile = getUploadedFile(req.files, "afterimage", "afterImage");

    if (!title || !shortDescription || !tag || !longdescription) {
      return res.status(400).json({
        message: "Title, shortDescription, tag, and longdescription are required",
      });
    }

    if (!resultPayload.title || !resultPayload.description) {
      return res
        .status(400)
        .json({ message: "Result title and description are required" });
    }

    if (!faqs.length || faqs.some((faq) => !faq.question || !faq.answer)) {
      return res.status(400).json({ message: "Each FAQ must include a question and answer" });
    }

    if (!beforeImageFile || !afterImageFile) {
      return res.status(400).json({ message: "Before and after result images are required" });
    }

    const beforeImage = await uploadImage(beforeImageFile, "shampurna/services/results");
    const afterImage = await uploadImage(afterImageFile, "shampurna/services/results");

    const service = await Service.create({
      title,
      shortDescription,
      tag,
      longdescription,
      result: {
        ...resultPayload,
        beforeimage: beforeImage.imageUrl,
        beforeimagePublicId: beforeImage.imagePublicId,
        afterimage: afterImage.imageUrl,
        afterimagePublicId: afterImage.imagePublicId,
      },
      faqs,
    });

    res.status(201).json(service);
  } catch (error) {
    console.error("Failed to create service:", error);
    res.status(500).json({ message: "Failed to create service" });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (req.body.title !== undefined) {
      const title = normalizeText(req.body.title);
      if (!title) return res.status(400).json({ message: "Title cannot be empty" });
      service.title = title;
    }

    if (req.body.shortDescription !== undefined) {
      const shortDescription = normalizeText(req.body.shortDescription);
      if (!shortDescription) {
        return res.status(400).json({ message: "shortDescription cannot be empty" });
      }
      service.shortDescription = shortDescription;
    }

    if (req.body.tag !== undefined) {
      const tag = normalizeText(req.body.tag);
      if (!tag) return res.status(400).json({ message: "Tag cannot be empty" });
      service.tag = tag;
    }

    if (req.body.longdescription !== undefined) {
      const longdescription = normalizeText(req.body.longdescription);
      if (!longdescription) {
        return res.status(400).json({ message: "longdescription cannot be empty" });
      }
      service.longdescription = longdescription;
    }

    if (!service.result) {
      service.result = {};
    }

    if (req.body.result !== undefined || req.body.resultTitle !== undefined) {
      const resultPayload = normalizeResultPayload(req.body);
      if (!resultPayload.title) {
        return res.status(400).json({ message: "Result title cannot be empty" });
      }
      service.result.title = resultPayload.title;
    }

    if (req.body.result !== undefined || req.body.resultDescription !== undefined) {
      const resultPayload = normalizeResultPayload(req.body);
      if (!resultPayload.description) {
        return res.status(400).json({ message: "Result description cannot be empty" });
      }
      service.result.description = resultPayload.description;
    }

    if (
      req.body.faq !== undefined ||
      req.body.faqs !== undefined ||
      req.body.faqQuestion !== undefined ||
      req.body.faqAnswer !== undefined
    ) {
      const faqs = normalizeFaqsPayload(req.body);
      if (!faqs.length || faqs.some((faq) => !faq.question || !faq.answer)) {
        return res.status(400).json({ message: "Each FAQ must include a question and answer" });
      }
      service.faqs = faqs;
    }

    const beforeImageFile = getUploadedFile(req.files, "beforeimage", "beforeImage");
    if (beforeImageFile) {
      const { imageUrl, imagePublicId } = await uploadImage(
        beforeImageFile,
        "shampurna/services/results"
      );

      if (service.result?.beforeimagePublicId) {
        await cloudinary.uploader.destroy(service.result.beforeimagePublicId);
      }

      service.result.beforeimage = imageUrl;
      service.result.beforeimagePublicId = imagePublicId;
    }

    const afterImageFile = getUploadedFile(req.files, "afterimage", "afterImage");
    if (afterImageFile) {
      const { imageUrl, imagePublicId } = await uploadImage(
        afterImageFile,
        "shampurna/services/results"
      );

      if (service.result?.afterimagePublicId) {
        await cloudinary.uploader.destroy(service.result.afterimagePublicId);
      }

      service.result.afterimage = imageUrl;
      service.result.afterimagePublicId = imagePublicId;
    }

    if (!service.result?.beforeimage || !service.result?.beforeimagePublicId) {
      return res.status(400).json({ message: "Before result image is required" });
    }

    if (!service.result?.afterimage || !service.result?.afterimagePublicId) {
      return res.status(400).json({ message: "After result image is required" });
    }

    await service.save();

    res.status(200).json(service);
  } catch (error) {
    console.error("Failed to update service:", error);
    res.status(500).json({ message: "Failed to update service" });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.imagePublicId) {
      await cloudinary.uploader.destroy(service.imagePublicId);
    }

    if (service.result?.beforeimagePublicId) {
      await cloudinary.uploader.destroy(service.result.beforeimagePublicId);
    }

    if (service.result?.afterimagePublicId) {
      await cloudinary.uploader.destroy(service.result.afterimagePublicId);
    }

    await service.deleteOne();

    res.status(200).json({ message: "Service deleted" });
  } catch (error) {
    console.error("Failed to delete service:", error);
    res.status(500).json({ message: "Failed to delete service" });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
