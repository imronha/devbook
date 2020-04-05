const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
// Express validator
const { check, validationResult } = require("express-validator");

// Import user models
const User = require("../../models/User");

// =================================================================

// @route   POST api/users
// @desc    Register new user
// @access  Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please use a valid email").isEmail(),
    check("password", "Password must be 6 or more characters long").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    // console.log(res);
    // Handle validation response & errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull fields out of req.body
    const { name, email, password } = req.body;
    // console.log(req.body);

    try {
      // // Check if user already exists
      let user = await User.findOne({ email });

      if (user) {
        res.status(400).json({ errors: [{ msg: "User already exists" }] });
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: "200", // Size
        r: "pg", // Rating
        d: "mm", // Default
      });

      // Create new instance of user
      user = new User({
        name,
        email,
        avatar,
        password,
      });

      //   Encrypt password and then save user
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

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
