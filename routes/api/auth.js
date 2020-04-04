const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

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

module.exports = router;
