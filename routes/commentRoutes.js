const express = require("express");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/:postId/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "name")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(400).json({ message: "Could not load comments.", error: err.message });
  }
});

router.post("/:postId/comments", auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Comment cannot be empty." });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found." });
    const comment = await Comment.create({ content: content.trim(), post: post._id, author: req.user.id });
    await comment.populate("author", "name");
    res.status(201).json({ message: "Comment added!", comment });
  } catch (err) {
    res.status(400).json({ message: "Could not add comment.", error: err.message });
  }
});

module.exports = router;
