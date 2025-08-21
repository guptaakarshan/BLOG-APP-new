import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
    const { loading } = useAuth();
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
                const res = await axios.get(`${baseURL}/api/admin/post-authors`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setSummary(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load admin data');
            } finally {
                setIsLoading(false);
            }
        };

        if (!loading) {
            fetchSummary();
        }
    }, [loading]);

    return (
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
                <p className="text-slate-300 mt-1">Overview of posts and authors</p>
            </div>

            {isLoading && <p className="text-blue-400">Loading...</p>}
            {error && <p className="text-rose-400">{error}</p>}

            {summary && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                            <div className="text-slate-400 text-sm">Total Posts</div>
                            <div className="text-2xl font-semibold text-white">{summary.totalPosts}</div>
                        </div>
                        <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                            <div className="text-slate-400 text-sm">Unique Authors</div>
                            <div className="text-2xl font-semibold text-white">{summary.uniqueAuthors}</div>
                        </div>
                        <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                            <div className="text-slate-400 text-sm">Top Author</div>
                            <div className="text-lg font-semibold text-white truncate">
                                {summary.authors?.[0]?.username || '—'}
                                {summary.authors?.[0] && (
                                    <span className="text-slate-300 text-sm"> ({summary.authors[0].postCount} posts)</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-white mb-3">Authors</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left border border-slate-700 rounded-lg overflow-hidden">
                                <thead className="bg-slate-700/60">
                                    <tr>
                                        <th className="px-4 py-3 text-slate-300 font-medium">Author</th>
                                        <th className="px-4 py-3 text-slate-300 font-medium">Email</th>
                                        <th className="px-4 py-3 text-slate-300 font-medium">Posts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.authors.map((a) => (
                                        <tr key={a.authorId} className="border-t border-slate-700">
                                            <td className="px-4 py-3 text-white">{a.username}</td>
                                            <td className="px-4 py-3 text-slate-300">{a.email}</td>
                                            <td className="px-4 py-3 text-white">{a.postCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;


