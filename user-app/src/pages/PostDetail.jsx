import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsApi } from '../api/client';
import UserAvatar from '../components/UserAvatar';
import LikeButton from '../components/LikeButton';
import CommentList from '../components/CommentList';
import TitleAttachment from '../components/TitleAttachment';
import { getDisplayName } from '../utils/displayName';
import { timeAgo } from '../utils/timeAgo';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    setLoading(true);
    postsApi.getOne(id)
      .then((res) => setPost(res.data.post))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim() || commenting) return;
    setCommenting(true);
    try {
      const { data } = await postsApi.addComment(id, commentBody.trim());
      setPost((p) => ({ ...p, comments: [...(p.comments || []), data.comment] }));
      setCommentBody('');
    } catch {
      // leave the text in place so the user can retry
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500 dark:text-gray-400">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card-glass p-6 mb-6">
        <div className="flex gap-3">
          <Link to={`/users/${post.user?.id}`} className="flex-shrink-0">
            <UserAvatar user={post.user} size="md" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <Link
                to={`/users/${post.user?.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-reelz-600 dark:hover:text-reelz-400 transition-colors"
              >
                {getDisplayName(post.user)}
              </Link>
              <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(post.createdAt)}</span>
            </div>
            <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{post.body}</p>
            {post.title && (
              <div className="mt-3 max-w-sm">
                <TitleAttachment title={post.title} />
              </div>
            )}
            <div className="mt-4">
              <LikeButton
                type="post"
                targetId={post.id}
                liked={!!post.likedByMe}
                likeCount={post.likeCount ?? 0}
                onChange={({ liked, likeCount }) =>
                  setPost((p) => ({ ...p, likedByMe: liked, likeCount }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Comments</h2>
      <div className="card-glass p-4 mb-4">
        <CommentList comments={post.comments || []} />
      </div>

      <form onSubmit={submitComment} className="flex gap-2">
        <input
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="Add a comment…"
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={!commentBody.trim() || commenting}
          className={`btn-primary text-sm ${!commentBody.trim() || commenting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {commenting ? 'Posting…' : 'Comment'}
        </button>
      </form>
    </div>
  );
}
