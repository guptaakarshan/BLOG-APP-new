const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { commentLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;

        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            popular: { 'likes.length': -1 }
        };

        const comments = await Comment.find({
            post: postId,
            status: 'approved',
            parentComment: null // Only top-level comments
        })
        .populate('author', 'username avatar')
        .sort(sortOptions[sort] || sortOptions.newest)
        .limit(limit * 1)
        .skip((page - 1) * limit);

        // Get total count for pagination
        const total = await Comment.countDocuments({
            post: postId,
            status: 'approved',
            parentComment: null
        });

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({
                    parentComment: comment.id,
                    status: 'approved'
                })
                .populate('author', 'username avatar')
                .sort({ createdAt: 1 })
                .limit(5); // Limit replies per comment

                return {
                    ...comment.toObject(),
                    replies,
                    replyCount: await Comment.countDocuments({
                        parentComment: comment.id,
                        status: 'approved'
                    })
                };
            })
        );

        res.json({
            comments: commentsWithReplies,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
});

// Create a new comment
router.post('/', authenticateToken, commentLimiter, async (req, res) => {
    try {
        const { content, postId, parentCommentId } = req.body;

        if (!content || !postId) {
            return res.status(400).json({ message: 'Content and post ID are required' });
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if parent comment exists (if replying to a comment)
        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
        }

        // Basic spam detection
        const spamScore = calculateSpamScore(content, req.user);

        const comment = new Comment({
            content,
            author: req.user.id,
            post: postId,
            parentComment: parentCommentId || null,
            status: spamScore > 70 ? 'pending' : 'approved', // Auto-approve if low spam score
            spamScore
        });

        await comment.save();

        // Update post comment count
        await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

        // Populate author info for response
        await comment.populate('author', 'username avatar');

        res.status(201).json({
            message: 'Comment posted successfully',
            comment
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Failed to post comment' });
    }
});

// Update a comment
router.put('/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user owns the comment or is admin
        if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to edit this comment' });
        }

        // Store edit history
        comment.editHistory.push({
            content: comment.content,
            editedAt: Date.now()
        });

        comment.content = content;
        comment.isEdited = true;
        comment.updatedAt = Date.now();

        await comment.save();

        res.json({
            message: 'Comment updated successfully',
            comment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Failed to update comment' });
    }
});

// Delete a comment
router.delete('/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user owns the comment or is admin
        if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        // Update post comment count
        await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

        await Comment.findByIdAndDelete(commentId);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Failed to delete comment' });
    }
});

// Like/Unlike a comment
router.post('/:commentId/like', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const likeIndex = comment.likes.findIndex(id => id.toString() === userId);
        const dislikeIndex = comment.dislikes.findIndex(id => id.toString() === userId);

        if (likeIndex > -1) {
            // Unlike
            comment.likes.splice(likeIndex, 1);
        } else {
            // Like
            comment.likes.push(userId);
            // Remove from dislikes if present
            if (dislikeIndex > -1) {
                comment.dislikes.splice(dislikeIndex, 1);
            }
        }

        await comment.save();

        res.json({
            message: likeIndex > -1 ? 'Comment unliked' : 'Comment liked',
            likes: comment.likes.length,
            dislikes: comment.dislikes.length
        });
    } catch (error) {
        console.error('Error liking comment:', error);
        res.status(500).json({ message: 'Failed to like comment' });
    }
});

// Dislike/Undislike a comment
router.post('/:commentId/dislike', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const dislikeIndex = comment.dislikes.findIndex(id => id.toString() === userId);
        const likeIndex = comment.likes.findIndex(id => id.toString() === userId);

        if (dislikeIndex > -1) {
            // Undislike
            comment.dislikes.splice(dislikeIndex, 1);
        } else {
            // Dislike
            comment.dislikes.push(userId);
            // Remove from likes if present
            if (likeIndex > -1) {
                comment.likes.splice(likeIndex, 1);
            }
        }

        await comment.save();

        res.json({
            message: dislikeIndex > -1 ? 'Comment undisliked' : 'Comment disliked',
            likes: comment.likes.length,
            dislikes: comment.dislikes.length
        });
    } catch (error) {
        console.error('Error disliking comment:', error);
        res.status(500).json({ message: 'Failed to dislike comment' });
    }
});

// Report a comment
router.post('/:commentId/report', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Reason is required' });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user already reported this comment
        const alreadyReported = comment.flags.some(flag => 
            flag.reportedBy.toString() === req.user.id
        );

        if (alreadyReported) {
            return res.status(400).json({ message: 'You have already reported this comment' });
        }

        comment.flags.push({
            reason,
            reportedBy: req.user.id
        });

        // Auto-flag as spam if multiple reports
        if (comment.flags.length >= 3) {
            comment.status = 'pending';
            comment.spamScore = Math.min(comment.spamScore + 30, 100);
        }

        await comment.save();

        res.json({ message: 'Comment reported successfully' });
    } catch (error) {
        console.error('Error reporting comment:', error);
        res.status(500).json({ message: 'Failed to report comment' });
    }
});

// Admin: Get all comments with filtering
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const comments = await Comment.find(filter)
            .populate('author', 'username email')
            .populate('post', 'title')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Comment.countDocuments(filter);

        res.json({
            comments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching admin comments:', error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
});

// Admin: Update comment status
router.put('/admin/:commentId/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected', 'spam'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const comment = await Comment.findByIdAndUpdate(
            commentId,
            { status },
            { new: true }
        ).populate('author', 'username');

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.json({
            message: 'Comment status updated successfully',
            comment
        });
    } catch (error) {
        console.error('Error updating comment status:', error);
        res.status(500).json({ message: 'Failed to update comment status' });
    }
});

// Helper function to calculate spam score
function calculateSpamScore(content, user) {
    let score = 0;

    // Check for suspicious patterns
    const suspiciousPatterns = [
        /\b(?:buy|cheap|discount|offer|limited|act now|click here)\b/gi,
        /\b(?:viagra|casino|loan|debt|weight loss)\b/gi,
        /\b(?:http|www|\.com|\.net|\.org)\b/gi,
        /\b(?:free|money|cash|earn|income)\b/gi
    ];

    suspiciousPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            score += matches.length * 10;
        }
    });

    // Check for excessive links
    const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (linkCount > 2) score += linkCount * 15;

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7) score += 20;

    // Check for repetitive text
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    if (repetitionRatio < 0.3) score += 25;

    // New user penalty
    if (user.createdAt && Date.now() - user.createdAt < 24 * 60 * 60 * 1000) {
        score += 15;
    }

    return Math.min(score, 100);
}

module.exports = router;
