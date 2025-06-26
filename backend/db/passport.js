// @ts-nocheck
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import FacebookStrategy from "passport-facebook";
import GitHubStrategy from "passport-github2";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const createOrFindUser = async (profile) => {
  const email = profile.emails?.[0]?.value;
  const avatar =
    profile.photos?.[0]?.value?.replace("=s96-c", "") ||
    profile._json?.avatar_url ||
    profile.picture?.data?.url;

  let user = await User.findOne({
    $or: [
      { googleId: profile.id },
      { facebookId: profile.id },
      { githubId: profile.id },
      { email },
    ],
  });

  if (!user) {
    user = await User.create({
      name: profile.displayName || profile.username,
      email,
      avatar,
      googleId: profile.provider === "google" ? profile.id : undefined,
      facebookId: profile.provider === "facebook" ? profile.id : undefined,
      githubId: profile.provider === "github" ? profile.id : undefined,
    });
  }

  return user;
};

// Google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (_, __, profile, done) => {
      try {
        const user = await createOrFindUser(profile);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// Facebook
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/auth/facebook/callback",
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (_, __, profile, done) => {
      try {
        const user = await createOrFindUser(profile);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// GitHub
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
      scope: ["user:email"],
    },
    async (_, __, profile, done) => {
      try {
        const user = await createOrFindUser(profile);
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

export const issueTokenAndRedirect = (req, res) => {
  const token = signToken(req.user);
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
};