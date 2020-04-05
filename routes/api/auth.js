const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
// Express validator
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route   GET api/auth
// @desc    Test route
// @access  Public
// Add middleware auth as second arg
router.get("/", auth, async (req, res) => {
  try {
    // Finds user id from req and removes password data from res
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/auth
// @desc    Authenticate user and get token (login)
// @access  Public
router.post(
  "/",
  [
    check("email", "Please use a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    // Handle validation response & errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      // // Check if user already exists
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User not found. Invalid Credentials" }] });
      }

      // If user is found, check if password matches
      // Use bcrypt's compare method compare input pw and db pw
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User not found. Invalid Credentials" }] });
      }

      // Get payload
      const payload = {
        user: {
          id: user.id,
        },
      };

      // Sign token, pass in payload, pass in secret, add expiration
      jwt.sign(
        payload,
        config.get("jwtToken"),
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server error");
    }
  }
);
module.exports = router;
