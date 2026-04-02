import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listsApi } from '../api/client';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';
const PLACEHOLDER = 'https://placehold.co/92x138/1f2937/9ca3af?text=?';

function MiniPosterGrid({ items }) {
  const posters = items.slice(0, 4);
  return (
    <div className="grid grid-cols-2 gap-1 w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
      {posters.map((item, i) => (
        <img
          key={item.id}
          src={item.title.posterPath ? `${TMDB_IMG}${item.title.posterPath}` : PLACEHOLDER}
          alt={item.title.title}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
      ))}
      {posters.length === 0 && (
        <div className="col-span-2 row-span-2 flex items-center justify-center text-gray-400 dark:text-gray-600 text-2xl">
          List
        </div>
      )}
    </div>
  );
}

export default function Lists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newList, setNewList] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listsApi.getAll()
      .then(res => setLists(res.data.lists || []))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    if (!newList.name.trim()) return;
    setCreating(true);
    try {
      const { data } = await listsApi.create(newList.name, newList.description || undefined);
      setLists(prev => [{ ...data.list, items: [], _count: { items: 0 } }, ...prev]);
      setNewList({ name: '', description: '' });
      setShowCreate(false);
    } catch {}
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this list?')) return;
    await listsApi.delete(id);
    setLists(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">My Lists</h1>
          <p className="text-gray-500 dark:text-gray-400">{lists.length} custom {lists.length === 1 ? 'list' : 'lists'}</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary"
        >
          + New List
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card-glass p-5 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create a new list</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              className="input-field"
              placeholder="List name (e.g. Date Night, Rainy Day...)"
              value={newList.name}
              onChange={e => setNewList(l => ({ ...l, name: e.target.value }))}
              required
              autoFocus
            />
            <input
              type="text"
              className="input-field"
              placeholder="Description (optional)"
              value={newList.description}
              onChange={e => setNewList(l => ({ ...l, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create List'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No lists yet</p>
          <p className="text-sm mt-1">Create your first list to organize titles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => (
            <div key={list.id} className="card-glass p-4 flex gap-4 items-center group hover:border-gray-300 dark:hover:border-gray-700 transition-all">
              <MiniPosterGrid items={list.items} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{list.name}</h3>
                {list.description && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 line-clamp-1">{list.description}</p>
                )}
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                  {list._count?.items ?? list.items.length} {list._count?.items === 1 ? 'title' : 'titles'}
                </p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  to={`/lists/${list.id}`}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(list.id)}
                  className="text-xs text-red-400 hover:text-red-500 dark:text-red-500/60 dark:hover:text-red-400 transition-colors px-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
