import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CommentForm = ({ onSubmit, onCancel, placeholder = "Write a comment...", parentCommentId = null }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    const maxLength = 1000;
    const remainingChars = maxLength - content.length;
    const isOverLimit = remainingChars < 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!content.trim() || isOverLimit) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                content: content.trim(),
                parentCommentId
            });
            setContent('');
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setContent('');
        onCancel();
    };

    return (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                </div>
                
                <div className="flex-1 min-w-0">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={placeholder}
                                rows="3"
                                className={`w-full px-3 py-2 bg-slate-600 border rounded-lg text-white placeholder-slate-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                                    isOverLimit ? 'border-red-500' : 'border-slate-500'
                                }`}
                                maxLength={maxLength}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className={`text-sm ${
                                    isOverLimit ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                    {remainingChars} characters remaining
                                </span>
                                
                                {isOverLimit && (
                                    <span className="text-sm text-red-400 font-medium">
                                        Comment too long!
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-slate-300 hover:text-white font-medium transition duration-200"
                                >
                                    Cancel
                                </button>
                                
                                <button
                                    type="submit"
                                    disabled={!content.trim() || isOverLimit || isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            
            {/* Spam prevention notice */}
            <div className="mt-3 text-xs text-slate-400">
                <p>💡 Tips to avoid spam detection:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Keep your comment relevant and meaningful</li>
                    <li>Avoid excessive links or promotional language</li>
                    <li>Don't use all caps or repetitive text</li>
                    <li>Be respectful and constructive</li>
                </ul>
            </div>
        </div>
    );
};

export default CommentForm;
