import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "lead_crm_secret_key";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// -------------------------------------------------------------
// Google OAuth Strategy Setup
// -------------------------------------------------------------
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/auth/google/callback";

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value.toLowerCase()
              : null;

          if (!email) {
            return done(new Error("No email found in Google profile"), null);
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              name: profile.displayName || "Google User",
              email,
              googleId: profile.id,
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// -------------------------------------------------------------
// 1. Sign Up / Register
// -------------------------------------------------------------
async function handleRegister(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Failed to register user" });
  }
}

router.post("/register", handleRegister);
router.post("/signup", handleRegister);

// -------------------------------------------------------------
// 2. Login
// -------------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // If user signed up with Google only and has no password
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account was created with Google Sign-In. Please continue with Google.",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Failed to log in" });
  }
});

// -------------------------------------------------------------
// 3. Logout
// -------------------------------------------------------------
router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out successfully" });
});

// -------------------------------------------------------------
// 4. Current Authenticated User (/me)
// -------------------------------------------------------------
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
});

// -------------------------------------------------------------
// 5. Google OAuth Routes
// -------------------------------------------------------------
router.get("/google", (req, res, next) => {
  if (!googleClientId || !googleClientSecret) {
    return res.status(400).json({
      message:
        "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env",
    });
  }
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (!googleClientId || !googleClientSecret) {
    return res.redirect(`${CLIENT_URL}/login?error=Google+OAuth+not+configured`);
  }

  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(
        `${CLIENT_URL}/login?error=${encodeURIComponent(
          err?.message || "Google authentication failed"
        )}`
      );
    }

    const token = generateToken(user);
    const userData = encodeURIComponent(
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
      })
    );

    // Redirect back to frontend dashboard with token
    return res.redirect(
      `${CLIENT_URL}/login?token=${token}&user=${userData}`
    );
  })(req, res, next);
});

async function handleGoogleDemo(_req, res) {
  try {
    const demoEmail = "google.demo@example.com";
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        name: "Google Demo User",
        email: demoEmail,
        googleId: "google-demo-12345",
      });
    }

    const token = generateToken(user);

    return res.json({
      message: "Google sign-in successful (Demo mode)",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Demo Google error:", error);
    return res.status(500).json({ message: "Demo Google login failed" });
  }
}

router.post("/google/demo", handleGoogleDemo);
router.post("/demo-google", handleGoogleDemo);

export default router;
