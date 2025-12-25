//components/CommentForm.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiSend } from 'react-icons/fi';
import { useTranslation } from '@/lib/i18n';

export default function CommentForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<{ id: string; username: string } | null>(null);
  const [fetching, setFetching] = useState(true);

  // Auto-fetch current user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Fetch the logged-in user's profile
        const { data } = await api.get('/users/me');
        setUserData({ id: data.id, username: data.username });
      } catch (err) {
        console.error('Failed to load user info', err);
        alert(t('failedToLoadData') || 'Could not identify user. Please login again.');
        onClose();
      } finally {
        setFetching(false);
      }
    };
    fetchUser();
  }, [t, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !comment.trim()) return;

    setLoading(true);
    try {
      await api.post('/comments', {
        userId: userData.id,
        username: userData.username,
        comment: comment
      });
      alert(t('commentSent') || 'Comment sent to admin successfully');
      setComment('');
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || t('error') || 'Failed to send comment');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm">{t('loadingUser') || 'Loading user info...'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Visual Indicator of who is sending (Auto-filled) */}
      {userData && (
        <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 flex flex-col">
          <span className="text-xs text-blue-500 uppercase font-bold tracking-wider mb-1">{t('sendingAs') || 'Sending as'}:</span>
          <span className="font-medium text-gray-800 text-sm">{userData.username} <span className="text-gray-500 font-normal">({userData.id})</span></span>
        </div>
      )}

      <div>
        <label className="sr-only">{t('comment') || 'Comment'}</label>
        <textarea
          name="comment"
          placeholder={t('writeComment') || "Write your feedback or comment here..."}
          required
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-700 bg-gray-50 focus:bg-white transition-all placeholder-gray-400"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !comment.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{t('sending') || 'Sending...'}</span>
          </>
        ) : (
          <>
            <FiSend />
            <span>{t('sendComment') || 'Send Comment'}</span>
          </>
        )}
      </button>
    </form>
  );
}