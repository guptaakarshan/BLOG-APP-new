import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const CommentSection = ({ postId }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (postId) {
            fetchComments();
        }
    }, [postId, currentPage, sortBy]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/comments/post/${postId}`, {
                params: {
                    page: currentPage,
                    limit: 10,
                    sort: sortBy
                }
            });

            setComments(response.data.comments);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching comments:', error);
            toast.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (commentData) => {
        try {
            const response = await axios.post('/api/comments', {
                content: commentData.content,
                postId: postId,
                parentCommentId: commentData.parentCommentId || null
            });

            if (response.data.comment.status === 'pending') {
                toast.success('Comment submitted and awaiting moderation');
            } else {
                toast.success('Comment posted successfully');
            }

            // Refresh comments
            setCurrentPage(1);
            fetchComments();
            setShowCommentForm(false);
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error(error.response?.data?.message || 'Failed to post comment');
        }
    };

    const handleCommentUpdate = async (commentId, content) => {
        try {
            await axios.put(`/api/comments/${commentId}`, { content });
            toast.success('Comment updated successfully');
            fetchComments();
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('Failed to update comment');
        }
    };

    const handleCommentDelete = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            await axios.delete(`/api/comments/${commentId}`);
            toast.success('Comment deleted successfully');
            fetchComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    const handleCommentLike = async (commentId) => {
        try {
            const response = await axios.post(`/api/comments/${commentId}/like`);
            fetchComments(); // Refresh to show updated like count
        } catch (error) {
            console.error('Error liking comment:', error);
            toast.error('Failed to like comment');
        }
    };

    const handleCommentDislike = async (commentId) => {
        try {
            const response = await axios.post(`/api/comments/${commentId}/dislike`);
            fetchComments(); // Refresh to show updated dislike count
        } catch (error) {
            console.error('Error disliking comment:', error);
            toast.error('Failed to dislike comment');
        }
    };

    const handleCommentReport = async (commentId, reason) => {
        try {
            await axios.post(`/api/comments/${commentId}/report`, { reason });
            toast.success('Comment reported successfully');
        } catch (error) {
            console.error('Error reporting comment:', error);
            toast.error('Failed to report comment');
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        setCurrentPage(1);
    };

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Comments</h3>
                <div className="flex items-center space-x-4">
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="popular">Most Popular</option>
                    </select>
                    
                    {isAuthenticated && (
                        <button
                            onClick={() => setShowCommentForm(!showCommentForm)}
                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            {showCommentForm ? 'Cancel' : 'Add Comment'}
                        </button>
                    )}
                </div>
            </div>

            {!isAuthenticated && (
                <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 mb-6">
                    <p className="text-slate-300 text-center">
                        Please{' '}
                        <button
                            onClick={() => setShowCommentForm(true)}
                            className="text-blue-400 hover:text-blue-300 font-medium underline"
                        >
                            sign in
                        </button>{' '}
                        to leave a comment
                    </p>
                </div>
            )}

            {showCommentForm && (
                <div className="mb-6">
                    <CommentForm
                        onSubmit={handleCommentSubmit}
                        onCancel={() => setShowCommentForm(false)}
                        placeholder="Share your thoughts..."
                    />
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-slate-300 mt-2">Loading comments...</p>
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-slate-300 text-lg">No comments yet. Be the first to share your thoughts!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            currentUser={user}
                            onUpdate={handleCommentUpdate}
                            onDelete={handleCommentDelete}
                            onLike={handleCommentLike}
                            onDislike={handleCommentDislike}
                            onReport={handleCommentReport}
                            onReply={(parentCommentId) => {
                                setShowCommentForm(true);
                                // You can implement a way to pre-fill the form with reply context
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition duration-200"
                        >
                            Previous
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 rounded-lg transition duration-200 ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700 border border-slate-600 text-white hover:bg-slate-600'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition duration-200"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentSection;
