import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PostViewPage = () => {
	const { id } = useParams();
	const [post, setPost] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchPost = async () => {
			try {
				setLoading(true);
				const { data } = await axios.get(`/api/posts/${id}`);
				setPost(data);
			} catch (err) {
				setError('Failed to load post.');
			} finally {
				setLoading(false);
			}
		};

		fetchPost();
	}, [id]);

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-900 flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
					<p className="text-slate-300 mt-4">Loading post...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-slate-900 flex items-center justify-center">
				<p className="text-rose-400 text-lg">{error}</p>
			</div>
		);
	}

	if (!post) {
		return null;
	}

	return (
		<div className="min-h-screen bg-slate-900 text-slate-200">
			<header className="bg-slate-800 border-b border-slate-700">
				<div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold text-white">Blogify</h1>
					<Link to="/" className="px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-600 transition">Home</Link>
				</div>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-8">
				<h2 className="text-4xl font-extrabold text-white mb-3">{post.title}</h2>
				<p className="text-slate-300 mb-8">
					By <span className="font-semibold">{post.authorName || post.author}</span> on{' '}
					<span className="font-semibold">{post.date ? new Date(post.date).toLocaleDateString() : ''}</span>
				</p>
				<div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
					{post.content}
				</div>
			</main>

			<footer className="bg-slate-800 border-t border-slate-700 py-6 text-center text-slate-400">
				Made by Akarshan
			</footer>
		</div>
	);
};

export default PostViewPage;


