import { google } from "googleapis";
import readline from "readline";

// Replace with your credentials
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/api/auth/google/callback";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Step 1: Generate the URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",       // ensures refresh token is returned
  prompt: "consent",            // force consent screen every time
  scope: ["https://www.googleapis.com/auth/gmail.send"],
});

console.log("👉 Authorize this app by visiting this URL:\n", authUrl);

// Step 2: Ask user for the code from URL
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nPaste the code from that page here: ", async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log("\n✅ Tokens received:");
    console.log("Access Token:", tokens.access_token);
    console.log("Refresh Token:", tokens.refresh_token);
    console.log("\n💾 Save the refresh token in your .env as GOOGLE_REFRESH_TOKEN");
  } catch (err) {
    console.error("❌ Error retrieving tokens:", err.message);
  } finally {
    rl.close();
  }
});
