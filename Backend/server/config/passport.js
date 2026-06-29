import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../model/user.js";


// ================= GOOGLE =================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        let user = null;

        // Find existing user by email
        if (email) {
          user = await User.findOne({ email });
        }

        // Otherwise find by Google ID
        if (!user) {
          user = await User.findOne({
            googleId: profile.id,
          });
        }

        // Create new user
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email,
            avatar: profile.photos?.[0]?.value,
            isVerified: true,
          });
        } else {
          // Link Google account
          user.googleId = profile.id;

          if (!user.avatar) {
            user.avatar = profile.photos?.[0]?.value;
          }

          if (!user.name) {
            user.name = profile.displayName;
          }

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


// ================= GITHUB =================
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/github/callback",
      scope: ["user:email"],
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails.length
            ? profile.emails[0].value
            : null;

        let user = null;

        // Find by email
        if (email) {
          user = await User.findOne({ email });
        }

        // Otherwise find by GitHub ID
        if (!user) {
          user = await User.findOne({
            githubId: profile.id,
          });
        }

        // Create new user
        if (!user) {
          user = await User.create({
            githubId: profile.id,
            name: profile.displayName || profile.username,
            email,
            avatar: profile.photos?.[0]?.value,
            isVerified: true,
          });
        } else {
          // Link GitHub account
          user.githubId = profile.id;

          if (!user.avatar) {
            user.avatar = profile.photos?.[0]?.value;
          }

          if (!user.name) {
            user.name = profile.displayName || profile.username;
          }

          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);


// ================= SERIALIZE =================
passport.serializeUser((user, done) => {
  done(null, user.id);
});


// ================= DESERIALIZE =================
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});