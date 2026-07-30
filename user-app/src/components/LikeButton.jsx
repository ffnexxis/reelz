import { useState } from 'react';
import { likesApi } from '../api/client';

// Heart toggle for posts and feed activity.
// `type` is 'post' | 'activity'; `targetId` is the raw post id or
// watchlistEntry id (NOT the composite feed id — split 'post:x'/'activity:x'
// before passing it here).
export default function LikeButton({ type, targetId, liked, likeCount, onChange, className = '' }) {
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const { data } = liked
        ? await likesApi.unlike(type, targetId)
        : await likesApi.like(type, targetId);
      onChange?.({ liked: data.liked, likeCount: data.likeCount });
    } catch {
      // idempotent endpoints; ignore
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-1.5 text-sm transition-colors ${
        liked
          ? 'text-red-500 dark:text-red-400'
          : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
      } ${busy ? 'opacity-60' : ''} ${className}`}
      title={liked ? 'Unlike' : 'Like'}
    >
      <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span>{likeCount ?? 0}</span>
    </button>
  );
}
