import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import CommentForm from "./CommentForm";

const CommentItem = ({
  comment,
  currentUser,
  onUpdate,
  onDelete,
  onLike,
  onDislike,
  onReport,
  onReply,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [editContent, setEditContent] = useState(comment.content);
  const { isAuthenticated } = useAuth();

  const isOwner = currentUser && comment.author.id === currentUser.id;
  const isAdmin = currentUser && currentUser.role === "admin";
  const canModify = isOwner || isAdmin;

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent !== comment.content) {
      await onUpdate(comment.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleReply = () => {
    setIsReplying(!isReplying);
  };

  const handleReplySubmit = async (replyData) => {
    // This would need to be implemented in the parent component
    // to handle nested replies properly
    setIsReplying(false);
  };

  const handleReport = () => {
    const reasons = ["inappropriate", "spam", "harassment", "other"];
    const reason = window.prompt(
      "Please select a reason for reporting:\n" +
        reasons.map((r, i) => `${i + 1}. ${r}`).join("\n") +
        "\n\nEnter the number (1-4):"
    );

    if (reason && ["1", "2", "3", "4"].includes(reason)) {
      const selectedReason = reasons[parseInt(reason) - 1];
      onReport(comment.id, selectedReason);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-xs">
              {comment.author.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">
                {comment.author.username}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-slate-400 bg-slate-600 px-2 py-1 rounded">
                  edited
                </span>
              )}
              {comment.status === "pending" && (
                <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-600">
                  pending
                </span>
              )}
            </div>
            <span className="text-sm text-slate-400">
              {formatDate(comment.createdAt)}
            </span>
          </div>
        </div>

        {canModify && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="text-slate-400 hover:text-blue-400 text-sm transition duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(comment._id)}
              className="text-slate-400 hover:text-red-400 text-sm transition duration-200"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Comment Content */}
      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows="3"
            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={1000}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-slate-300 hover:text-white text-sm transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition duration-200"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      )}

      {/* Comment Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Like/Dislike */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onLike(comment._id)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition duration-200 ${
                comment.likes.includes(currentUser?.id)
                  ? "text-blue-400 bg-blue-900/20"
                  : "text-slate-400 hover:text-blue-400 hover:bg-slate-600"
              }`}
            >
              <span>👍</span>
              <span>{comment.likes.length}</span>
            </button>

            <button
              onClick={() => onDislike(comment._id)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition duration-200 ${
                comment.dislikes.includes(currentUser?.id)
                  ? "text-red-400 bg-red-900/20"
                  : "text-slate-400 hover:text-red-400 hover:bg-slate-600"
              }`}
            >
              <span>👎</span>
              <span>{comment.dislikes.length}</span>
            </button>
          </div>

          {/* Reply Button */}
          {isAuthenticated && (
            <button
              onClick={handleReply}
              className="text-slate-400 hover:text-blue-400 text-sm transition duration-200"
            >
              Reply
            </button>
          )}

          {/* Report Button */}
          {isAuthenticated && !isOwner && (
            <button
              onClick={handleReport}
              className="text-slate-400 hover:text-red-400 text-sm transition duration-200"
            >
              Report
            </button>
          )}
        </div>

        {/* Spam Score Indicator (Admin only) */}
        {isAdmin && comment.spamScore > 0 && (
          <div className="text-xs text-slate-400">
            Spam Score: {comment.spamScore}%
          </div>
        )}
      </div>

      {/* Reply Form */}
      {isReplying && (
        <div className="mt-4">
          <CommentForm
            onSubmit={handleReplySubmit}
            onCancel={() => setIsReplying(false)}
            placeholder={`Reply to ${comment.author.username}...`}
            parentCommentId={comment.id}
          />
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium mb-3 transition duration-200"
          >
            {showReplies ? "Hide" : "Show"} {comment.replies.length}{" "}
            {comment.replies.length === 1 ? "reply" : "replies"}
          </button>

          {showReplies && (
            <div className="space-y-3 ml-6 border-l-2 border-slate-600 pl-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onLike={onLike}
                  onDislike={onDislike}
                  onReport={onReport}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
