'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFirebaseToken } from '@/lib/store/authStore';
import './library.css';

const GuideCard = ({ guide, highlight }: { guide: any, highlight?: boolean }) => (
    <div className={`guide-card ${highlight ? 'highlighted' : ''}`}>
        <div className="guide-badges">
            <span className={`badge subject-${guide.subject}`}>
                {guide.subject}
            </span>
            <span className={`badge difficulty-${guide.difficulty}`}>
                {guide.difficulty}
            </span>
            {guide.isPremium && <span className="badge premium">⭐ Pro</span>}
        </div>
        <h4 className="font-bold">{guide.title}</h4>
        <p className="text-sm text-gray-700 mt-2 flex-grow">{guide.summary}</p>
        <div className="guide-meta mt-4">
            <span>⏱ {guide.estimatedReadTime} min read</span>
            {guide.studentAccuracy !== undefined && (
                <span className="accuracy weak text-red-600 font-bold ml-auto">
                    Your accuracy: {guide.studentAccuracy}%
                </span>
            )}
        </div>
        <Link href={`/dashboard/library/${guide._id}`} className="read-btn">
            Read Guide →
        </Link>
    </div>
);

export default function LibraryPage() {
    const [subject, setSubject] = useState('english');
    const [search, setSearch] = useState('');
    const [guides, setGuides] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchGuides = async () => {
        try {
            const token = await getFirebaseToken();
            const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch recommended
            const recRes = await fetch('/api/backend/library/guides/recommended', { headers });
            const recData = await recRes.json();
            if (recData.success) {
                setRecommended(recData.guides || []);
            }

            // Fetch normal guides
            const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
            const guidesRes = await fetch(`/api/backend/library/guides?subject=${subject}${searchParam}`, { headers });
            const guidesData = await guidesRes.json();
            if (guidesData.success) {
                setGuides(guidesData.guides || []);
            }
        } catch (err) {
            console.error('Error fetching library guides:', err);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when subject or search changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGuides();
        }, 300); // debounce search
        return () => clearTimeout(timer);
    }, [subject, search]);

    return (
        <div className="library-page">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Learning Library</h1>

            {/* RECOMMENDED BANNER */}
            {recommended.length > 0 && (
                <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">📌 Recommended For You</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">Based on your weak topics</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommended.map((g: any) => <GuideCard key={g._id} guide={g} highlight />)}
                    </div>
                </div>
            )}

            {/* SUBJECT FILTER TABS */}
            <div className="subject-tabs">
                {['english', 'mathematics', 'biology'].map(s => (
                    <button
                        key={s}
                        className={`tab ${subject === s ? 'active' : ''}`}
                        onClick={() => setSubject(s)}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* SEARCH BAR */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search guides by title, content, or topic..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* GUIDE GRID */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="guide-grid mb-8">
                    {guides.length > 0 ? (
                        guides.map((guide: any) => (
                            <GuideCard key={guide._id} guide={guide} />
                        ))
                    ) : (
                        <p className="text-gray-500 py-8">No guides found. Try a different search.</p>
                    )}
                </div>
            )}
        </div>
    );
}
