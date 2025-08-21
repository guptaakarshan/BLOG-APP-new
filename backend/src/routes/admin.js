const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(authenticateToken, requireAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalUsers,
            totalPosts,
            totalComments,
            pendingComments,
            recentUsers,
            recentPosts,
            recentComments
        ] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            Comment.countDocuments(),
            Comment.countDocuments({ status: 'pending' }),
            User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt'),
            Post.find().sort({ date: -1 }).limit(5).select('title authorName date status'),
            Comment.find().sort({ createdAt: -1 }).limit(5).populate('author', 'username').populate('post', 'title')
        ]);

        // Get user growth data for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Get post views data
        const topPosts = await Post.find()
            .sort({ viewCount: -1 })
            .limit(5)
            .select('title viewCount commentCount date');

        res.json({
            stats: {
                totalUsers,
                totalPosts,
                totalComments,
                pendingComments
            },
            recent: {
                users: recentUsers,
                posts: recentPosts,
                comments: recentComments
            },
            analytics: {
                userGrowth,
                topPosts
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
});

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role, status } = req.query;

        const filter = {};
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) filter.role = role;
        if (status !== undefined) filter.isActive = status === 'active';

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(filter);

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// Update user role or status
router.put('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, isActive } = req.body;

        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user' });
    }
});

// Delete user (admin only)
router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if trying to delete self
        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // Delete user's posts and comments
        await Post.deleteMany({ author: userId });
        await Comment.deleteMany({ author: userId });

        // Delete user
        await User.findByIdAndDelete(userId);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

// Get all posts with pagination and filtering
router.get('/posts', async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status, author } = req.query;

        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) filter.status = status;
        if (author) filter.author = author;

        const posts = await Post.find(filter)
            .populate('author', 'username email')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Post.countDocuments(filter);

        res.json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Failed to fetch posts' });
    }
});

// Update post status
router.put('/posts/:postId/status', async (req, res) => {
    try {
        const { postId } = req.params;
        const { status } = req.body;

        if (!['draft', 'published', 'archived'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const post = await Post.findByIdAndUpdate(
            postId,
            { status },
            { new: true }
        ).populate('author', 'username');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json({
            message: 'Post status updated successfully',
            post
        });
    } catch (error) {
        console.error('Error updating post status:', error);
        res.status(500).json({ message: 'Failed to update post status' });
    }
});

// Delete post (admin only)
router.delete('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Delete all comments for this post
        await Comment.deleteMany({ post: postId });

        // Delete post
        await Post.findByIdAndDelete(postId);

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Failed to delete post' });
    }
});

// Get comment moderation queue
router.get('/comments/moderation', async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'pending' } = req.query;

        const comments = await Comment.find({ status })
            .populate('author', 'username email')
            .populate('post', 'title')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Comment.countDocuments({ status });

        res.json({
            comments,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total
        });
    } catch (error) {
        console.error('Error fetching moderation queue:', error);
        res.status(500).json({ message: 'Failed to fetch moderation queue' });
    }
});

// Bulk comment moderation
router.post('/comments/bulk-moderation', async (req, res) => {
    try {
        const { commentIds, action } = req.body;

        if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
            return res.status(400).json({ message: 'Comment IDs array is required' });
        }

        if (!['approve', 'reject', 'spam', 'delete'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        let updateData = {};
        let deleteComments = false;

        switch (action) {
            case 'approve':
                updateData = { status: 'approved' };
                break;
            case 'reject':
                updateData = { status: 'rejected' };
                break;
            case 'spam':
                updateData = { status: 'spam' };
                break;
            case 'delete':
                deleteComments = true;
                break;
        }

        if (deleteComments) {
            // Get post IDs to update comment counts
            const comments = await Comment.find({ _id: { $in: commentIds } });
            const postIds = [...new Set(comments.map(c => c.post.toString()))];

            // Delete comments
            await Comment.deleteMany({ _id: { $in: commentIds } });

            // Update post comment counts
            for (const postId of postIds) {
                const count = await Comment.countDocuments({ post: postId });
                await Post.findByIdAndUpdate(postId, { commentCount: count });
            }
        } else {
            await Comment.updateMany(
                { _id: { $in: commentIds } },
                updateData
            );
        }

        res.json({
            message: `Comments ${action}d successfully`,
            count: commentIds.length
        });
    } catch (error) {
        console.error('Error in bulk moderation:', error);
        res.status(500).json({ message: 'Failed to process bulk moderation' });
    }
});

// Get system statistics
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            newUsersThisMonth,
            newUsersThisWeek,
            totalPosts,
            newPostsThisMonth,
            newPostsThisWeek,
            totalComments,
            newCommentsThisMonth,
            newCommentsThisWeek,
            pendingComments,
            spamComments
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: lastMonth } }),
            User.countDocuments({ createdAt: { $gte: lastWeek } }),
            Post.countDocuments(),
            Post.countDocuments({ createdAt: { $gte: lastMonth } }),
            Post.countDocuments({ createdAt: { $gte: lastWeek } }),
            Comment.countDocuments(),
            Comment.countDocuments({ createdAt: { $gte: lastMonth } }),
            Comment.countDocuments({ createdAt: { $gte: lastWeek } }),
            Comment.countDocuments({ status: 'pending' }),
            Comment.countDocuments({ status: 'spam' })
        ]);

        res.json({
            users: {
                total: totalUsers,
                newThisMonth: newUsersThisMonth,
                newThisWeek: newUsersThisWeek
            },
            posts: {
                total: totalPosts,
                newThisMonth: newPostsThisMonth,
                newThisWeek: newPostsThisWeek
            },
            comments: {
                total: totalComments,
                newThisMonth: newCommentsThisMonth,
                newThisWeek: newCommentsThisWeek,
                pending: pendingComments,
                spam: spamComments
            }
        });
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({ message: 'Failed to fetch system statistics' });
    }
});

// Get total posts and authors with their post counts
router.get('/post-authors', async (req, res) => {
    try {
        const [totalPosts, authorAggregation] = await Promise.all([
            Post.countDocuments(),
            Post.aggregate([
                { $group: { _id: '$author', postCount: { $sum: 1 } } },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 0,
                        authorId: { $toString: '$_id' },
                        username: '$user.username',
                        email: '$user.email',
                        postCount: 1
                    }
                },
                { $sort: { postCount: -1, username: 1 } }
            ])
        ]);

        res.json({
            totalPosts,
            uniqueAuthors: authorAggregation.length,
            authors: authorAggregation
        });
    } catch (error) {
        console.error('Error fetching post authors summary:', error);
        res.status(500).json({ message: 'Failed to fetch post author summary' });
    }
});

module.exports = router;
