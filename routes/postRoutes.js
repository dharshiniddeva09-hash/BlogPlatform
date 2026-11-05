const express = require("express");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "name").sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Could not load posts.", error: err.message });
  }
});

router.get("/:postId", async (req, res, next) => {
  // Let the comment routes handle /:postId/comments.
  if (req.path.endsWith("/comments")) return next();
  try {
    const post = await Post.findById(req.params.postId).populate("author", "name");
    if (!post) return res.status(404).json({ message: "Post not found." });
    res.json(post);
  } catch (err) {
    res.status(400).json({ message: "Invalid post ID." });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: "Title and content are required." });
    const post = await Post.create({ title: title.trim(), content: content.trim(), author: req.user.id });
    await post.populate("author", "name");
    res.status(201).json({ message: "Blog post created!", post });
  } catch (err) {
    res.status(500).json({ message: "Could not create post.", error: err.message });
  }
});

router.put("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (String(post.author) !== req.user.id) return res.status(403).json({ message: "You can edit only your own posts." });
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: "Title and content are required." });
    post.title = title.trim();
    post.content = content.trim();
    await post.save();
    await post.populate("author", "name");
    res.json({ message: "Blog post updated!", post });
  } catch (err) {
    res.status(400).json({ message: "Could not update post.", error: err.message });
  }
});

router.delete("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (String(post.author) !== req.user.id) return res.status(403).json({ message: "You can delete only your own posts." });
    await Post.deleteOne({ _id: post._id });
    const Comment = require("../models/Comment");
    await Comment.deleteMany({ post: post._id });
    res.json({ message: "Blog post deleted." });
  } catch (err) {
    res.status(400).json({ message: "Could not delete post.", error: err.message });
  }
});

module.exports = router;
