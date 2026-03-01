'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseToken } from '@/lib/store/authStore';
import '../library.css';
import { marked } from 'marked';

export default function GuidePage({ params }: { params: { id: string } }) {
    const [guide, setGuide] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchGuide = async () => {
            try {
                const token = await getFirebaseToken();
                const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`/api/backend/library/guides/${params.id}`, { headers });
                const data = await res.json();

                if (data.showUpgrade) {
                    // You could redirect to a paywall or show a modal, but for now we show the error
                    setError(data.message);
                    return;
                }

                if (data.success && data.guide) {
                    setGuide(data.guide);
                } else {
                    setError(data.error || 'Failed to load guide');
                }
            } catch (err) {
                setError('Error loading guide');
            } finally {
                setLoading(false);
            }
        };
        fetchGuide();
    }, [params.id]);

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center max-w-lg mx-auto bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl mt-12">
                <h3 className="font-bold text-xl mb-2">Access Restrained</h3>
                <p>{error}</p>
                <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-red-600 text-white font-bold rounded-lg relative">← Go Back</button>
            </div>
        );
    }

    if (!guide) return null;

    return (
        <div className="guide-page bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 min-h-screen">
            {/* HEADER */}
            <div className="guide-header">
                <button className="back-btn mb-6 font-bold flex items-center gap-2 hover:text-blue-700 transition" onClick={() => router.back()}>
                    ← Back to Library
                </button>
                <div className="guide-badges mb-4">
                    <span className="badge bg-blue-100 text-blue-700 capitalize">{guide.subject}</span>
                    <span className="badge bg-emerald-100 text-emerald-700 capitalize">{guide.examType}</span>
                    <span className="badge bg-purple-100 text-purple-700 capitalize">{guide.difficulty}</span>
                    <span className="badge bg-gray-100 text-gray-700">⏱ {guide.estimatedReadTime} min read</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6 leading-tight">{guide.title}</h1>
            </div>

            {/* KEY POINTS QUICK VIEW */}
            {guide.keyPoints && guide.keyPoints.length > 0 && (
                <div className="key-points-box dark:bg-indigo-900/20 dark:border-indigo-500">
                    <h4 className="font-bold text-indigo-700 dark:text-indigo-300">⚡ Key Takeaways</h4>
                    <ul className="text-indigo-900 dark:text-indigo-100 mt-2 space-y-1">
                        {guide.keyPoints.map((point: string, i: number) => (
                            <li key={i}>{point}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* MAIN CONTENT — render markdown */}
            <div
                className="guide-content text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{
                    __html: marked(guide.content || 'No content provided.')
                }}
            />

            {/* STICKY PRACTICE CTA */}
            <div className="sticky-cta dark:bg-gray-900">
                <button
                    className="practice-btn"
                    onClick={() => router.push(`/dashboard/question-bank?subject=${guide.subject}`)}
                >
                    📝 Practice {guide.topic} Questions Now
                </button>
            </div>
        </div>
    );
}
