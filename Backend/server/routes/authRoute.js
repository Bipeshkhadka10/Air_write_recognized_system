const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { authValidation } = require("../middleware/authMiddleWare");

const router = express.Router();

// Redirect to Google login page
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

// Google callback
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {
        try {
            const token = jwt.sign(
                {
                    id: req.user._id,
                    email: req.user.email,
                },
                process.env.PRIVATE_KEY,
                {
                    expiresIn: "7d",
                }
            );

            res.redirect(
                `${process.env.CLIENT_URL}/auth-success?token=${token}`
            );
        } catch (error) {
            console.error("Google Login Error:", error);

            res.redirect(
                `${process.env.CLIENT_URL}/login?error=Google_login_failed`
            );
        }
    }
);

// Get logged-in user
router.get("/me", authValidation, async (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "http://localhost:5173/signin",
  }),

  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
        email: req.user.email,
      },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "7d",
      }
    );

    res.redirect(
      `http://localhost:5173/auth-success?token=${token}`
    );
  }
);

module.exports = router;