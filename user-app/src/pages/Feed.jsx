import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { feedApi, postsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PostComposer from '../components/PostComposer';
import UserAvatar from '../components/UserAvatar';
import LikeButton from '../components/LikeButton';
import TitleAttachment from '../components/TitleAttachment';
import CommentList from '../components/CommentList';
import { getDisplayName } from '../utils/displayName';
import { timeAgo } from '../utils/timeAgo';

// One merged feed item (type 'post' | 'activity'), with inline like +
// inline comments (posts only). item.id is composite ('post:<id>' |
// 'activity:<watchlistEntryId>') — split to get the raw target id.
function FeedCard({ item, currentUser }) {
  const [liked, setLiked] = useState(!!item.likedByMe);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? 0);

  // Inline comments (posts only)
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(null); // null = not loaded yet
  const [commentCount, setCommentCount] = useState(item.commentCount ?? 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [commentBody, setCommentBody] = useState('');
  const [sending, setSending] = useState(false);

  const [likeType, rawId] = item.id.split(':');
  const isPost = item.type === 'post';

  const verb =
    item.type === 'activity'
      ? `${item.verb || 'watched'}${item.status === 'WATCHED' && item.personalRating ? ` ★${item.personalRating}` : ''}`
      : null;

  const toggleComments = async () => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && comments === null) {
      setLoadingComments(true);
      setCommentError(null);
      try {
        const { data } = await postsApi.getOne(rawId);
        const post = data.post || data;
        const list = post.comments || [];
        setComments(list);
        setCommentCount(list.length);
      } catch {
        setCommentError('Could not load comments.');
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const body = commentBody.trim();
    if (!body || sending) return;
    setSending(true);
    setCommentError(null);
    try {
      const { data } = await postsApi.addComment(rawId, body);
      const comment = data.comment || data;
      if (!comment.user) comment.user = currentUser;
      setComments((prev) => [...(prev || []), comment]);
      setCommentCount((c) => c + 1);
      setCommentBody('');
    } catch {
      setCommentError('Failed to add comment. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card-glass p-4 transition-all hover:border-gray-300 dark:hover:border-gray-700">
      <div className="flex gap-3">
        <Link to={`/users/${item.user?.id}`} className="flex-shrink-0">
          <UserAvatar user={item.user} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          {/* Header line */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              to={`/users/${item.user?.id}`}
              className="font-semibold text-gray-900 dark:text-white hover:text-reelz-600 dark:hover:text-reelz-400 transition-colors"
            >
              {getDisplayName(item.user)}
            </Link>
            {verb && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{verb}</span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {timeAgo(item.createdAt)}
            </span>
          </div>

          {/* Post body */}
          {isPost && item.body && (
            <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {item.body}
            </p>
          )}

          {/* Attached / watched title */}
          {item.title && (
            <div className="mt-2 max-w-sm">
              <TitleAttachment title={item.title} compact />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4">
            <LikeButton
              type={likeType}
              targetId={rawId}
              liked={liked}
              likeCount={likeCount}
              onChange={({ liked: l, likeCount: c }) => {
                setLiked(l);
                if (typeof c === 'number') setLikeCount(c);
              }}
            />
            {isPost && (
              <button
                onClick={toggleComments}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  commentsOpen
                    ? 'text-reelz-600 dark:text-reelz-400'
                    : 'text-gray-400 hover:text-reelz-600 dark:text-gray-500 dark:hover:text-reelz-400'
                }`}
                title={commentsOpen ? 'Hide comments' : 'Show comments'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{commentCount}</span>
              </button>
            )}
          </div>

          {/* Inline comments */}
          {isPost && commentsOpen && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <CommentList comments={comments || []} />
              )}

              {commentError && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">{commentError}</p>
              )}

              <form onSubmit={submitComment} className="mt-3 flex gap-2 items-start">
                <UserAvatar user={currentUser} size="sm" />
                <input
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Add a comment…"
                  className="input-field text-sm flex-1"
                />
                <button
                  type="submit"
                  disabled={!commentBody.trim() || sending}
                  className={`btn-primary text-sm py-1.5 px-3 ${
                    !commentBody.trim() || sending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {sending ? '…' : 'Reply'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await feedApi.get(30);
      setItems(res.data.items || []);
    } catch {
      setError('Could not load your feed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Show a freshly created post immediately at the top of the feed.
  const handleCreated = (post) => {
    if (!post?.id) {
      load();
      return;
    }
    setItems((prev) => [
      {
        id: `post:${post.id}`,
        type: 'post',
        user: post.user || user,
        body: post.body,
        title: post.title || null,
        createdAt: post.createdAt || new Date().toISOString(),
        likeCount: 0,
        likedByMe: false,
        commentCount: 0,
      },
      ...prev,
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Feed</h1>
        <p className="text-gray-500 dark:text-gray-400">
          What the people you follow are watching and saying
        </p>
      </div>

      {/* Composer */}
      <div className="mb-6">
        <PostComposer onCreated={handleCreated} />
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card-glass p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="btn-primary text-sm"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card-glass p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-reelz-500 to-purple-600 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            Your feed is empty
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 mb-5">
            Follow some people to see what they're watching and posting.
          </p>
          <Link to="/people" className="btn-primary text-sm">
            Find people to follow
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedCard key={item.id} item={item} currentUser={user} />
          ))}
        </div>
      )}
    </div>
  );
}
