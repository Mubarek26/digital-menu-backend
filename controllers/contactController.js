const { Resend } = require("resend");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { adminTemplate } = require("../utils/emailTemplate");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendContactEmail = catchAsync(async (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return next(new AppError("All fields are required.", 400));
  }

  try {
    await resend.emails.send({
      from: "Saro Support <onboarding@resend.dev>",
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `New Contact Message from ${name}`,
      html: adminTemplate(name, email, message)
    });

    return res.status(200).json({ success: true, message: "Email sent successfully!" });

  } catch (error) {
    console.log("Resend error:", error);
    return next(new AppError("Failed to send email", 500));
  }
});
