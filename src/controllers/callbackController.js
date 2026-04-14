const CallbackRequest = require("../models/CallbackRequest");
const Service = require("../models/Service");
const sendEmail = require("../utils/sendEmail");

const VALID_STATUSES = ["pending", "not received", "done"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9\s()-]{7,20}$/;

const normalizeText = (value) => `${value ?? ""}`.trim();

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

const serviceExists = async (title) => {
  const service = await Service.findOne({ title }).select("_id");
  return Boolean(service);
};

const escapeHtml = (value) =>
  normalizeText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const callbackSuccessEmail = (callback) => `
  <h2>Appointment Request Received</h2>
  <p>Dear ${escapeHtml(callback.fullName)},</p>
  <p>Your request has been submitted successfully. Our team will contact you soon.</p>
  <p><strong>Preferred service:</strong> ${escapeHtml(callback.preferredService)}</p>
  <p><strong>Preferred date:</strong> ${escapeHtml(callback.preferredDate)}</p>
  <p><strong>Preferred time:</strong> ${escapeHtml(callback.preferredTime)}</p>
  ${callback.description ? `<p><strong>Description:</strong> ${escapeHtml(callback.description)}</p>` : ""}
  <br />
  <p>Thank you,<br/>Shampurna</p>
`;

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

    if (!(await serviceExists(preferredService))) {
      return res.status(400).json({ message: "Preferred service must match an available service title" });
    }

    const callback = await CallbackRequest.create({
      fullName,
      phoneNumber,
      email,
      preferredService,
      preferredDate,
      preferredTime,
      description,
    });

    sendEmail(
      callback.email,
      "Appointment Request Submitted Successfully",
      callbackSuccessEmail(callback)
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
      if (!(await serviceExists(preferredService))) {
        return res.status(400).json({ message: "Preferred service must match an available service title" });
      }
      callback.preferredService = preferredService;
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
