// @ts-nocheck
// config/passport.js
import passport from "passport"
const GoogleStrategy = require('passport-google-oauth20').Strategy;
import Intern from "../model/internModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await Intern.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Create new user
        user = await Intern.create({
          googleId: profile.id,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          isEmailVerified: true,
          provider: 'google',
          profileImage: profile.photos[0].value
        });

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await Intern.findById(id);
  done(null, user);
});