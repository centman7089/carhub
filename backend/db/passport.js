// @ts-nocheck
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/userModel.js";


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value
    });
  }
  done(null, user);
}));

// passport.use(new FacebookStrategy({
//   clientID: keys.facebook.clientID,
//   clientSecret: keys.facebook.clientSecret,
//   callbackURL: "/auth/facebook/callback",
//   profileFields: ['id', 'displayName', 'emails']
// }, async (accessToken, refreshToken, profile, done) => {
//   let user = await User.findOne({ facebookId: profile.id });
//   if (!user) {
//     user = await User.create({
//       facebookId: profile.id,
//       name: profile.displayName,
//       email: profile.emails?.[0]?.value
//     });
//   }
//   done(null, user);
// }));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ githubId: profile.id });
  if (!user) {
    user = await User.create({
      githubId: profile.id,
      name: profile.displayName || profile.username,
      email: profile.emails?.[0]?.value
    });
  }
  done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user_.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
