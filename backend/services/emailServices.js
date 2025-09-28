// backend/services/emailService.js
import nodemailer from "nodemailer";
import oAuth2Client from "../utils/googleAuth.js";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: `Your App <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (err) {
    throw new Error("Email send failed: " + err.message);
  }
};
