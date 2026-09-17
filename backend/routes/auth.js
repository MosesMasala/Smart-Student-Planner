// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail } = require("../models/User");
const { validateEmail, validatePassword, validateRequired, collectErrors } = require("../utils/validate");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const errors = collectErrors([
      validateRequired(name, "Name"),
      validateEmail(email),
      validatePassword(password),
    ]);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ errors: ["An account with this email already exists."] });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await createUser(name.trim(), email.toLowerCase(), hashedPassword);

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: { id: userId, name, email },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const errors = collectErrors([
      validateEmail(email),
      validateRequired(password, "Password"),
    ]);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await findUserByEmail(email.toLowerCase());
    if (!user) {
      // Same message for wrong email or wrong password - don't reveal which
      return res.status(401).json({ errors: ["Invalid email or password."] });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ errors: ["Invalid email or password."] });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
