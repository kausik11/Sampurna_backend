const express = require("express");
const path = require("path");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const serviceRoutes = require("./src/routes/serviceRoutes");
const testimonialRoutes = require("./src/routes/testimonialRoutes");
const callbackRoutes = require("./src/routes/callbackRoutes");
const newsletterRoutes = require("./src/routes/newsletterRoutes");
const userRoutes = require("./src/routes/userRoutes");
const resultImageRoutes = require("./src/routes/resultImageRoutes");
const videoTestimonialRoutes = require("./src/routes/videoTestimonialRoutes");
const faqRoutes = require("./src/routes/faqRoutes");
const galleryRoutes = require("./src/routes/galleryRoutes");
const globalErrorHandler = require("./src/middlewares/globalErrorHandler");
const PreferenceEvent = require("./src/models/PreferenceEvent");

// Honor reverse proxies (e.g. Vercel) so req.ip contains the real client IP
app.set("trust proxy", true);

const allowedOrigins = [
 "https://shampurna-a.vercel.app",
 "https://shampurna-admin.vercel.app",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const preferenceDefaults = {
  country: "IN",
  region: "WB",
  timezone: "Asia/Kolkata",
  currency: "INR",
};

const getCookieOptions = () => ({
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
   path: "/",
});

// Read preference cookies and expose defaults if missing
// app.use((req, res, next) => {
//   const fromCookies = req.cookies || {};
//   const preferences = {
//     country: fromCookies.country || preferenceDefaults.country,
//     region: fromCookies.region || preferenceDefaults.region,
//     timezone: fromCookies.timezone || preferenceDefaults.timezone,
//     language: fromCookies.language || preferenceDefaults.language,
//     currency: fromCookies.currency || preferenceDefaults.currency,
//   };

//   req.preferences = preferences;
//   res.locals.preferences = preferences;
//   next();
// });

// Set preference cookies (explicit POST)
app.post("/set-preferences", async (req, res, next) => {
  const options = getCookieOptions();
  const incoming = req.body || {};
  const preferences = {
    country: incoming.location.country_name || preferenceDefaults.country,
    region: incoming.location.state_code || preferenceDefaults.region,
    timezone: incoming.location.city  || preferenceDefaults.timezone,
    currency: incoming.currency.code || preferenceDefaults.currency,
  };

  Object.entries(preferences).forEach(([key, value]) => {
    res.cookie(key, value, options);
  });

  try {
    const { ip, location, country_metadata, currency, city,country_name, zipcode,district } = req.body || {};

    if (!ip || !location || !country_metadata || !currency) {
      return res.status(400).json({
        ok: false,
        message:
          "Missing required fields: ip, location, country_metadata, currency",
      });
    }

    await PreferenceEvent.create({
      ip,
      location,
      country_metadata,
      currency,
    });

    return res.json({ ok: true, preferences });
  } catch (err) {
    return next(err);
  }
});

// Quick responses to keep serverless invocations short
app.get("/", (_req, res) => res.json({ ok: true, message: "API is running" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// Lightweight health check (no DB call)
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() })
);

// Auth routes (login/register) remain public
app.use("/api/users", userRoutes);

// Protected admin resources
app.use("/api/services", serviceRoutes);
app.use("/api/testimonials", testimonialRoutes);

// Public endpoints
app.use("/api/callbacks", callbackRoutes);
app.use("/api/newsletter", newsletterRoutes);

// Result before/after images
app.use("/api/resultimage", resultImageRoutes);
app.use("/api/result-images", resultImageRoutes);
// Video testimonials
app.use("/api/video-testimonials", videoTestimonialRoutes);
// FAQs
app.use("/api/faqs", faqRoutes);
// Gallery
app.use("/api/gallery", galleryRoutes);
// 404 handler for any unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

// Global error handler must be last
app.use(globalErrorHandler);


module.exports = app;
