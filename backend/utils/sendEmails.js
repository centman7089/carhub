// sendEmails.js
// @ts-nocheck
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ MailerSend SMTP transporter (username + password)
const transporter = nodemailer.createTransport({
  host: "smtp.mailersend.net",
  port: 587, // TLS (STARTTLS)
  secure: false, // must be false for port 587
  auth: {
    user: process.env.MAILERSEND_SMTP_USER, // your MailerSend SMTP username
    pass: process.env.MAILERSEND_SMTP_PASS, // your MailerSend SMTP password
  },
});

// ✅ Verify transporter
transporter.verify((error) => {
  if (error) {
    console.error("❌ MailerSend transporter error:", error);
  } else {
    console.log("✅ MailerSend SMTP server is ready to send messages");
  }
});

// ✅ Email template builder
const buildEmailTemplate = (
  title,
  message,
  code = null,
  buttonText = null,
  buttonLink = null
) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
              border: 1px solid #eee; padding: 20px; border-radius: 10px; background: #fafafa;">
    <h2 style="color: #2c3e50; text-align: center;">🚗 Auction System</h2>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
    
    <h3 style="color: #27ae60;">${title}</h3>
    <p style="font-size: 15px; color: #333;">${message}</p>

    ${
      code
        ? `<div style="background:#f4f4f4;padding:12px 20px;border-radius:8px;
                     font-size:20px;font-weight:bold;width:max-content;margin:20px auto;text-align:center;">
            ${code}
          </div>`
        : ""
    }

    ${
      buttonText && buttonLink
        ? `<div style="text-align: center; margin-top: 25px;">
            <a href="${buttonLink}" style="background: #27ae60; color: white;
               padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
              ${buttonText}
            </a>
          </div>`
        : ""
    }

    <p style="font-size: 13px; color: #777; margin-top: 40px; text-align:center;">
      If you have any questions, please contact our support team.<br>
      © ${new Date().getFullYear()} Auction System. All rights reserved.
    </p>
  </div>`;
};

// ✅ Send email
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.MAILERSEND_FROM, // must be a verified sender in MailerSend
      to,
      subject,
      html,
    });
    console.log(`📩 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message || err);
  }
};

// ✅ Quick helpers
const sendVerificationEmail = async (to, code) => {
  return sendEmail(
    to,
    "Verify Your Auction System Email",
    buildEmailTemplate(
      "Verify Your Email",
      "Please use the code below to verify your email. It expires in 10 minutes.",
      code
    )
  );
};

const sendPasswordResetEmail = async (to, code) => {
  return sendEmail(
    to,
    "Password Reset Code",
    buildEmailTemplate(
      "Password Reset Request",
      "Use the code below to reset your password. It expires in 10 minutes.",
      code
    )
  );
};

const sendApprovalEmail = async (to) => {
  return sendEmail(
    to,
    "Account Approved 🎉",
    buildEmailTemplate(
      "Your Account is Approved",
      "Congratulations! Your documents have been approved. You can now log in and start using Auction System.",
      null,
      "Go to Dashboard",
      process.env.CLIENT_URL || "http://localhost:3000"
    )
  );
};

const sendRejectionEmail = async (to, reason) => {
  return sendEmail(
    to,
    "Document Rejected ❌",
    buildEmailTemplate(
      "Your Document Was Rejected",
      `Unfortunately, your submitted document was rejected. Reason: <b>${reason}</b>. Please upload a valid document and try again.`
    )
  );
};

export {
  sendEmail,
  buildEmailTemplate,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendApprovalEmail,
  sendRejectionEmail,
};
