const CallbackRequest = require("../models/CallbackRequest");
const Service = require("../models/Service");
const sendEmail = require("../utils/sendEmail");
const callbackRequestSuccess = require("../utils/callbackRequestSuccess");

const VALID_STATUSES = ["pending", "not received", "done"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9\s()-]{7,20}$/;

const normalizeText = (value) => `${value ?? ""}`.trim();
const normalizeServiceTitle = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPreferredService = (body) =>
  normalizeText(body.preferredService ?? body.preferedService ?? body.service);

const getPreferredDate = (body) =>
  normalizeText(body.preferredDate ?? body.preferedDate);

const getPreferredTime = (body) =>
  normalizeText(body.preferredTime ?? body.preferedTime);

const isValidFutureOrTodayDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;
  return value >= getTodayDate();
};

const validateCallbackDetails = ({
  fullName,
  phoneNumber,
  email,
  preferredService,
  preferredDate,
  preferredTime,
}) => {
  if (!fullName || !phoneNumber || !email || !preferredService || !preferredDate || !preferredTime) {
    return "Full name, phone number, email, preferred service, preferred date, and preferred time are required";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "Valid email is required";
  }

  if (!PHONE_REGEX.test(phoneNumber)) {
    return "Valid phone number is required";
  }

  if (!isValidFutureOrTodayDate(preferredDate)) {
    return "Preferred date must be today or a future date";
  }

  return null;
};

const resolvePreferredService = async (title) => {
  const normalizedTitle = normalizeServiceTitle(title);

  if (!normalizedTitle) {
    return null;
  }

  const services = await Service.find().select("title");

  if (!services.length) {
    return normalizeText(title);
  }

  const matchedService = services.find(
    (service) => normalizeServiceTitle(service.title) === normalizedTitle
  );

  return matchedService?.title || null;
};

const createCallback = async (req, res) => {
  try {
    const fullName = normalizeText(req.body.fullName);
    const phoneNumber = normalizeText(req.body.phoneNumber);
    const email = normalizeText(req.body.email).toLowerCase();
    const preferredService = getPreferredService(req.body);
    const preferredDate = getPreferredDate(req.body);
    const preferredTime = getPreferredTime(req.body);
    const description = normalizeText(req.body.description);

    const validationError = validateCallbackDetails({
      fullName,
      phoneNumber,
      email,
      preferredService,
      preferredDate,
      preferredTime,
    });
    if (validationError) return res.status(400).json({ message: validationError });

    const resolvedPreferredService = await resolvePreferredService(preferredService);

    if (!resolvedPreferredService) {
      return res.status(400).json({ message: "Preferred service must match an available service title" });
    }

    const callback = await CallbackRequest.create({
      fullName,
      phoneNumber,
      email,
      preferredService: resolvedPreferredService,
      preferredDate,
      preferredTime,
      description,
    });

    await sendEmail(
      callback.email,
      "Your Shampurna Appointment Request Has Been Received",
      callbackRequestSuccess(callback)
    );

    res.status(201).json(callback);
  } catch (error) {
    console.error("Failed to create callback request:", error);
    res.status(500).json({ message: "Failed to create callback request" });
  }
};

const updateCallback = async (req, res) => {
  try {
    const { status, adminComment } = req.body;
    const callback = await CallbackRequest.findById(req.params.id);

    if (!callback) {
      return res.status(404).json({ message: "Callback request not found" });
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status. Use pending, not received, or done" });
      }
      callback.status = status;
    }

    if (adminComment !== undefined) {
      callback.adminComment = normalizeText(adminComment);
    }

    if (req.body.fullName !== undefined) {
      const fullName = normalizeText(req.body.fullName);
      if (!fullName) return res.status(400).json({ message: "Full name cannot be empty" });
      callback.fullName = fullName;
    }

    if (req.body.phoneNumber !== undefined) {
      const phoneNumber = normalizeText(req.body.phoneNumber);
      if (!PHONE_REGEX.test(phoneNumber)) {
        return res.status(400).json({ message: "Valid phone number is required" });
      }
      callback.phoneNumber = phoneNumber;
    }

    if (req.body.email !== undefined) {
      const email = normalizeText(req.body.email).toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ message: "Valid email is required" });
      }
      callback.email = email;
    }

    if (
      req.body.preferredService !== undefined ||
      req.body.preferedService !== undefined ||
      req.body.service !== undefined
    ) {
      const preferredService = getPreferredService(req.body);
      if (!preferredService) {
        return res.status(400).json({ message: "Preferred service cannot be empty" });
      }
      const resolvedPreferredService = await resolvePreferredService(preferredService);
      if (!resolvedPreferredService) {
        return res.status(400).json({ message: "Preferred service must match an available service title" });
      }
      callback.preferredService = resolvedPreferredService;
    }

    if (req.body.preferredDate !== undefined || req.body.preferedDate !== undefined) {
      const preferredDate = getPreferredDate(req.body);
      if (!isValidFutureOrTodayDate(preferredDate)) {
        return res.status(400).json({ message: "Preferred date must be today or a future date" });
      }
      callback.preferredDate = preferredDate;
    }

    if (req.body.preferredTime !== undefined || req.body.preferedTime !== undefined) {
      const preferredTime = getPreferredTime(req.body);
      if (!preferredTime) {
        return res.status(400).json({ message: "Preferred time cannot be empty" });
      }
      callback.preferredTime = preferredTime;
    }

    if (req.body.description !== undefined) {
      callback.description = normalizeText(req.body.description);
    }

    await callback.save({ validateModifiedOnly: true });
    res.status(200).json(callback);
  } catch (error) {
    console.error("Failed to update callback request:", error);
    res.status(500).json({ message: "Failed to update callback request" });
  }
};

const listCallbacks = async (_req, res) => {
  try {
    const callbacks = await CallbackRequest.find().sort({ createdAt: -1 });
    res.status(200).json(callbacks);
  } catch (error) {
    console.error("Failed to fetch callback requests:", error);
    res.status(500).json({ message: "Failed to fetch callback requests" });
  }
};

const getCallback = async (req, res) => {
  try {
    const callback = await CallbackRequest.findById(req.params.id);

    if (!callback) {
      return res.status(404).json({ message: "Callback request not found" });
    }

    res.status(200).json(callback);
  } catch (error) {
    console.error("Failed to fetch callback request:", error);
    res.status(500).json({ message: "Failed to fetch callback request" });
  }
};

module.exports = {
  createCallback,
  updateCallback,
  listCallbacks,
  getCallback,
};
