const escapeHtml = (value) =>
  `${value ?? ""}`
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (value) => {
  if (!value) return "";

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return escapeHtml(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(parsedDate);
};

const formatTime = (value) => {
  if (!value || !/^\d{2}:\d{2}/.test(value)) {
    return escapeHtml(value);
  }

  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${`${minutes}`.padStart(2, "0")} ${period}`;
};

module.exports = (callback) => `
  <div style="margin:0;padding:24px;background:#f7f1f5;font-family:Arial,sans-serif;color:#2a1020;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #ecd8e4;border-radius:16px;overflow:hidden;">
      <div style="padding:28px 32px;background:linear-gradient(135deg,#4a1138,#8f8743);color:#fff8df;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.88;">
          Shampurna Aesthetic
        </p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;">
          Appointment Request Received
        </h1>
      </div>

      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">
          Dear ${escapeHtml(callback.fullName)},
        </p>

        <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#5f4150;">
          Thank you for reaching out to Shampurna Aesthetic. Your consultation request has been received successfully. Our team will review your details and contact you shortly to confirm the next step.
        </p>

        <div style="margin:0 0 24px;padding:20px;border-radius:14px;background:#fbf8fa;border:1px solid #efdfe7;">
          <p style="margin:0 0 12px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#8f8743;">
            Request Summary
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.7;color:#43202f;">
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Preferred Service</td>
              <td style="padding:6px 0;">${escapeHtml(callback.preferredService)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Preferred Date</td>
              <td style="padding:6px 0;">${formatDate(callback.preferredDate)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Preferred Time</td>
              <td style="padding:6px 0;">${formatTime(callback.preferredTime)}</td>
            </tr>
            ${
              callback.description
                ? `
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Your Concern</td>
              <td style="padding:6px 0;">${escapeHtml(callback.description)}</td>
            </tr>
            `
                : ""
            }
          </table>
        </div>

        <p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#5f4150;">
          Please keep this email for your reference. If you need to share anything else before our team reaches out, simply reply to this message.
        </p>

        <p style="margin:24px 0 0;font-size:15px;line-height:1.8;color:#5f4150;">
          Warm regards,<br />
          <strong style="color:#2a1020;">Shampurna Aesthetic</strong>
        </p>
      </div>
    </div>
  </div>
`;
