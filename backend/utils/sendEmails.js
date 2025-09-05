// @ts-nocheck
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Create transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

// ✅ HTML email template wrapper
const buildEmailTemplate = (title, message, buttonText, buttonLink) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px; background: #fafafa;">
    <h2 style="color: #2c3e50; text-align: center;">🚗 Auction System</h2>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
    <h3 style="color: #27ae60;">${title}</h3>
    <p style="font-size: 15px; color: #333;">${message}</p>
    ${
      buttonText && buttonLink
        ? `
      <div style="text-align: center; margin-top: 25px;">
        <a href="${buttonLink}" style="background: #27ae60; color: white; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
          ${buttonText}
        </a>
      </div>`
        : ""
    }
    <p style="font-size: 13px; color: #777; margin-top: 40px;">
      If you have any questions, please contact our support team.<br>
      © ${new Date().getFullYear()} Auction System. All rights reserved.
    </p>
  </div>`;
};

// ✅ Send email function
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"CarHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📩 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
};

export { sendEmail, buildEmailTemplate };
