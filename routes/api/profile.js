const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

// Used for github api
const request = require("request");
const config = require("config");

// Import models
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Post = require("../../models/Post");

// =======================================================

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    // Name and avatar are in the user model so use .populate(model, [fields to bring in]) to bring in desired fields
    // console.log("profile route");
    const profile = await Profile.findOne({
      user: req.user.id,
    });
    // console.log(profile);
    if (!profile) {
      return res.status(400).json({ msg: "Current user has no profile" });
    }
    res.json(profile.populate("user", ["name", "avatar"]));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// =======================================================

// @route   POST api/profile
// @desc    Create or update profile
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("status", "Skills are required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull fields out of req.body
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    // Update and insert data after creating objects
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      // If profile found, update db
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      // Create profile if not found
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server error");
    }

    // console.log(profileFields.skills);
    // res.send("Hello");
  }
);

// =======================================================

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// =======================================================

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get("/user/:user_id", async (req, res) => {
  try {
    // User id comes from URL { user: req.params.user_id }
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile)
      return res.status(400).json({ msg: "No profile found for this user" });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    // If not valid objectID, respond w/ same error message
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found." });
    }
    res.status(500).send("Server Error");
  }
});

// =======================================================

// @route   DELETE api/profile
// @desc    Delete profile, user, and posts
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    // Remove user's posts
    await Post.deleteMany({ user: req.user.id });

    // Remove Profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // Remove User
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User deleted." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// =======================================================

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private

router.put(
  "/experience",
  [
    auth,
    [
      // Validation
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    // console.log(res);
    // Handle validation response & errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull experience fields out of req.body
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    // Create new instance of experience object
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// =======================================================

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    // Get profile of the user
    const profile = await Profile.findOne({ user: req.user.id });

    // Get index of the experience from profile
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    // Removing (splicing) and then save
    profile.experience.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// =======================================================

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private

router.put(
  "/education",
  [
    auth,
    [
      // Validation
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldofstudy", "Field of study is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    // console.log(res);
    // Handle validation response & errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull education fields out of req.body
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    // Create new instance of education object
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// =======================================================

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    // Get profile of the user
    const profile = await Profile.findOne({ user: req.user.id });

    // Get index of the education from profile
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    // Removing (splicing) and then save
    profile.education.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// =======================================================

// @route   GET api/profile/github/:username
// @desc    Get user repos from github
// @access  public

router.get("/github/:username", (req, res) => {
  try {
    // Create options object that has our URI to plug into request package
    // Pass in github client ID and github client secret to URI
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    // Pass in options object to request
    request(options, (error, response, body) => {
      if (error) console.error(error);
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No Github profile found" });
      }

      // Return parsed response body
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
