const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

// Import models
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// =================================================================

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    // Handle validation response & errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // Find user without pw data
      const user = await User.findById(req.user.id).select("-password");

      // Create new post instance object
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      // Create new post variable and send in response
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server error");
    }
  }
);

// =================================================================

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // Find posts and sort by most recent
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// =================================================================

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    // Find posts with id
    const post = await Post.findById(req.params.id);

    // Check if posts found
    if (!post) {
      return res.status(400).json({ msg: "Posts not found" });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);

    // If not valid objectID, respond w/ same error message
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "Posts not found." });
    }

    res.status(500).send("Server Error");
  }
});

// =================================================================

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    // Find post with current user ID
    const post = await Post.findById(req.params.id);

    // Check if post doesnt exist
    if (!post) {
      return res.status(404).json({ msg: "Posts not found." });
    }

    // Check to make sure the current user is the owner of post, else delete
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized to delete" });
    }
    await post.remove();

    res.json({ msg: "Post deleted successfully" });
  } catch (err) {
    // If not valid objectID, respond w/ same error message
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "Posts not found." });
    }
  }
});

// =================================================================

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private

router.put("/like/:id", auth, async (req, res) => {
  try {
    // Find the id of the current post
    const post = await Post.findById(req.params.id);

    // Check to see if current user already liked current post
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// =================================================================

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private

router.put("/unlike/:id", auth, async (req, res) => {
  try {
    // Find the id of the current post
    const post = await Post.findById(req.params.id);

    // Check to see if current user already liked current post
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "Post has not been liked" });
    }

    // Get remove index and remove it from array
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// =================================================================

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    // Handle validation response & errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // Find user without pw data
      const user = await User.findById(req.user.id).select("-password");
      // Wait for post id
      const post = await Post.findById(req.params.id);

      // Create new comment instance
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      // Add comment to post's comment array and save
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server error");
    }
  }
);

// =================================================================

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment from post
// @access  Private

router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    // Find post by ID
    const post = await Post.findById(req.params.id);

    // Get comment from post
    const comment = post.comments.find(
      (comment) => (comment.id = req.params.comment_id)
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    // Check if user that made the comment is the same as current user
    if (comment.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "User not authorized. Not your comment to delete." });
    }

    // Filter comments by id index and remove it from array
    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
