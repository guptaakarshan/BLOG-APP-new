// src/routes/posts.js

const express = require('express');
const Post = require('../models/Post');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET all blog posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find(); // Retrieve all posts from the database
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET a single blog post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); // Find post by ID
        if (post) {
            res.json(post);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// CREATE a new blog post (authenticated)
router.post('/', authenticateToken, async (req, res) => {
    const { title, content, author, authorName, tags, featured } = req.body;

    if (!title || !content || !author || !authorName) {
        return res.status(400).json({ message: 'Title, content, author, and authorName are required' });
    }

    // Ensure the authenticated user is the author unless admin
    if (req.user.role !== 'admin' && req.user.id !== author) {
        return res.status(403).json({ message: 'You can only create posts for your own user' });
    }

    const newPost = new Post({
        title,
        content,
        author,
        authorName,
        tags: Array.isArray(tags) ? tags : [],
        featured: !!featured
    });

    try {
        const savedPost = await newPost.save(); // Save the new post to the database
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATE an existing blog post (authenticated and owner/admin)
router.put('/:id', authenticateToken, async (req, res) => {
    const { title, content, authorName, tags, featured, status } = req.body;

    try {
        const existing = await Post.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Ownership or admin check
        if (req.user.role !== 'admin' && existing.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (authorName !== undefined) updateData.authorName = authorName;
        if (Array.isArray(tags)) updateData.tags = tags;
        if (featured !== undefined) updateData.featured = !!featured;
        if (status !== undefined) updateData.status = status;

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE a blog post (authenticated and owner/admin)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const existing = await Post.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (req.user.role !== 'admin' && existing.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;