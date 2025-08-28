// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/auth/AuthModal";
import CommentSection from "./components/comments/CommentSection";
import PostViewPage from "./components/PostViewPage";
import AdminDashboard from "./components/admin/AdminDashboard";

// Base URL for our backend API
const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api/posts`;

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-slate-300 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const [currentView, setCurrentView] = useState("landing");
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Only fetch posts after the user starts from the landing page
  useEffect(() => {
    if (currentView !== "landing") {
      fetchPosts();
    }
  }, [currentView]);

  // Effect to handle body scrolling based on current view
  useEffect(() => {
    if (currentView === "landing") {
      document.body.classList.add("landing-view");
    } else {
      document.body.classList.remove("landing-view");
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove("landing-view");
    };
  }, [currentView]);

  // Function to fetch all posts from the backend
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a single post by ID
  const fetchPostById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSelectedPost(data);
      setCurrentView("view"); // Switch to view mode after fetching
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Failed to load post details.");
      setCurrentView("list"); // Go back to list if post not found
    } finally {
      setLoading(false);
    }
  };

  // Function to handle creating a new post
  const handleCreatePost = async (postData) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...postData,
          author: user.id,
          authorName: user.username,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      await response.json();
      setSuccessMessage("Post created successfully!");
      setCurrentView("list");
      fetchPosts();
    } catch (err) {
      console.error("Error creating post:", err);
      setError(`Failed to create post: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle updating an existing post
  const handleUpdatePost = async (id, postData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(postData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      await response.json();
      setSuccessMessage("Post updated successfully!");
      setCurrentView("list");
      fetchPosts();
    } catch (err) {
      console.error("Error updating post:", err);
      setError(`Failed to update post: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle deleting a post
  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setSuccessMessage("Post deleted successfully!");
      setCurrentView("list");
      fetchPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("Failed to delete post.");
    } finally {
      setLoading(false);
    }
  };

  // --- Components for different views ---

  // PostList Component
  const PostList = () => (
    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white">All Blog Posts</h2>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <button
              onClick={() => setCurrentView("create")}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Create New Post
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Sign In to Create Post
            </button>
          )}

          
        </div>
      </div>

      {loading && <p className="text-blue-400 text-lg">Loading posts...</p>}
      {error && <p className="text-rose-400 text-lg font-medium">{error}</p>}
      {successMessage && (
        <p className="text-emerald-400 text-lg font-medium mb-4">
          {successMessage}
        </p>
      )}

      {posts.length === 0 && !loading && !error && (
        <p className="text-slate-300 text-lg">
          No posts available. Start by creating one!
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-slate-700 p-6 rounded-lg border border-slate-600 shadow-sm hover:shadow-lg transition duration-200"
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              {post.title}
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              By {post.authorName || post.author} on{" "}
              {post.date ? new Date(post.date).toLocaleDateString() : ""}
            </p>
            <p className="text-slate-200 text-base mb-4 line-clamp-3">
              {post.content}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={() => fetchPostById(post.id)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition duration-300"
                >
                  View
                </button>
                {isAuthenticated && (user?.id === post.author || isAdmin) && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedPost(post);
                        setCurrentView("edit");
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-md shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition duration-300"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
              {post.commentCount > 0 && (
                <span className="text-slate-400 text-sm">
                  💬 {post.commentCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // PostDetail Component
  const PostDetail = ({ post, onBack, onEdit, onDelete }) => (
    <div className="p-8 bg-slate-800 rounded-xl shadow-lg max-w-4xl mx-auto border border-slate-700">
      <h2 className="text-4xl font-extrabold text-white mb-4">{post.title}</h2>
      <p className="text-lg text-slate-300 mb-6">
        By{" "}
        <span className="font-semibold">{post.authorName || post.author}</span>{" "}
        on{" "}
        <span className="font-semibold">
          {post.date ? new Date(post.date).toLocaleDateString() : ""}
        </span>
      </p>
      <div className="text-slate-200 leading-relaxed mb-8">
        <p>{post.content}</p>
      </div>

      <div className="flex space-x-4 mb-8">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-700 border border-slate-600 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          Back to List
        </button>
        {isAuthenticated && (user?.id === post.author || isAdmin) && (
          <>
            <button
              onClick={onEdit}
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              Edit Post
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="px-6 py-3 bg-rose-600 text-white font-semibold rounded-lg shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              Delete Post
            </button>
          </>
        )}
      </div>

      {/* Comment Section */}
      <CommentSection postId={post.id} />
    </div>
  );

  // PostForm Component (for both Create and Edit)
  const PostForm = ({ post, onSubmit, onCancel }) => {
    const [title, setTitle] = useState(post ? post.title : "");
    const [content, setContent] = useState(post ? post.content : "");
    const maxTitleLength = 120;
    const maxContentLength = 5000;

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!title || !content) {
        alert("Please fill in all fields.");
        return;
      }
      onSubmit({ title, content });
    };

    return (
      <div className="relative overflow-hidden max-w-3xl mx-auto">
        <div className="absolute -inset-20 bg-[radial-gradient(45rem_45rem_at_top,rgba(37,99,235,0.15),transparent)]" aria-hidden="true" />
        <div className="relative p-8 md:p-10 bg-slate-800/80 backdrop-blur rounded-2xl shadow-2xl border border-slate-700">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {post ? "Edit Post" : "Create New Post"}
            </h2>
            <p className="mt-2 text-slate-300 text-base">
              {post
                ? "Update your story with clearer thoughts."
                : "Share a clear, compelling title and engaging content."}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="title" className="block text-sm font-semibold text-slate-200">
                  Title
                </label>
                <span className="text-xs tabular-nums text-slate-400">
                  {title.length}/{maxTitleLength}
                </span>
              </div>
              <div className="rounded-xl border border-slate-600 bg-slate-800/60 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 transition">
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={maxTitleLength}
                  placeholder="e.g., 10 Lessons I Learned Building My First App"
                  className="w-full px-4 py-3 md:py-4 bg-transparent text-white placeholder-slate-400 outline-none text-base md:text-lg rounded-xl"
                  required
                  aria-describedby="title-help"
                />
              </div>
              <p id="title-help" className="mt-2 text-xs text-slate-400">
                Keep it descriptive and under {maxTitleLength} characters.
              </p>
            </div>
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="content" className="block text-sm font-semibold text-slate-200">
                  Content
                </label>
                <span className="text-xs tabular-nums text-slate-400">
                  {content.length}/{maxContentLength}
                </span>
              </div>
              <div className="rounded-xl border border-slate-600 bg-slate-800/60 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 transition">
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="10"
                  maxLength={maxContentLength}
                  placeholder="Write your story... Use paragraphs, structure your thoughts, and be yourself."
                  className="w-full resize-y min-h-[220px] px-4 py-3 md:py-4 bg-transparent text-white placeholder-slate-400 outline-none text-base md:text-lg rounded-xl"
                  required
                  aria-describedby="content-help"
                ></textarea>
              </div>
              <p id="content-help" className="mt-2 text-xs text-slate-400">
                Tip: Break long ideas into short paragraphs for better readability.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              >
                {post ? "Update Post" : "Publish Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Router-based admin and post view pages
  // When in router context, render routes. We keep currentView for legacy views.

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-200">
      {currentView !== "landing" && (
        <header className="text-center py-10">
          <div className="flex items-center justify-between max-w-6xl mx-auto px-4">
            <div className="text-left">
              <h1 className="text-5xl font-extrabold leading-tight text-white">
                Blogify
              </h1>
              <p className="text-xl text-slate-300 mt-2">
                Your story, your words, your world.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-slate-300">
                    Welcome,{" "}
                    <span className="text-blue-400 font-semibold">
                      {user?.username}
                    </span>
                  </span>
                  
                  {isAdmin && (
                    <button
                      onClick={() => setCurrentView("admin")}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
                    >
                      Admin
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-600 transition duration-300"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  Sign In
                </button>
              )}

              <button
                onClick={() => {
                  setCurrentView("landing");
                  setSelectedPost(null);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-600 transition duration-300"
              >
                Home
              </button>
            </div>
          </div>
        </header>
      )}

      <main
        className={
          currentView === "landing"
            ? "flex-1"
            : "container mx-auto px-4 flex-grow"
        }
      >
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                currentView === "landing" ? (
                  <LandingPage onStart={() => setCurrentView("list")} />
                ) : (
                  <PostList />
                )
              }
            />
            <Route path="/posts/:id" element={<PostViewPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        {currentView === "admin" && isAdmin && (
          <AdminDashboard />
        )}
        {currentView === "create" && (
          <PostForm
            onSubmit={handleCreatePost}
            onCancel={() => {
              setCurrentView("list");
              setError(null);
              setSuccessMessage(null);
            }}
          />
        )}
        {currentView === "view" && selectedPost && (
          <PostDetail
            post={selectedPost}
            onBack={() => {
              setCurrentView("list");
              setSelectedPost(null);
              setError(null);
              setSuccessMessage(null);
            }}
            onEdit={() => setCurrentView("edit")}
            onDelete={handleDeletePost}
          />
        )}
        {currentView === "edit" && selectedPost && (
          <PostForm
            post={selectedPost}
            onSubmit={(updatedData) =>
              handleUpdatePost(selectedPost.id, updatedData)
            }
            onCancel={() => {
              setCurrentView("view");
              setError(null);
              setSuccessMessage(null);
            }}
          />
        )}
      </main>

      {/* Footer Section */}
      {currentView !== "landing" && (
        <footer className="mt-10 py-4 text-center text-slate-400 text-sm">
          © 2025 Blog App. All rights reserved. | Built by Akarshan Gupta
        </footer>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
};

// Wrapper component with providers
const App = () => {
  return (
    <GoogleOAuthProvider clientId="1091927785335-hl0gsldlrq0h0p5vgipmrhs98pig75ob.apps.googleusercontent.com">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
