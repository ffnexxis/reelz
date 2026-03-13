import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

const ROLE_STYLES = {
  ADMIN: 'bg-brand-100 text-brand-700',
  USER: 'bg-gray-100 text-gray-600',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    adminApi.getUsers()
      .then(res => setUsers(res.data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const filtered = users
    .filter(u => !search || u.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av, bv;
      if (sortBy === 'email') { av = a.email; bv = b.email; }
      else if (sortBy === 'watchlist') { av = a._count.watchlistEntries; bv = b._count.watchlistEntries; }
      else if (sortBy === 'lists') { av = a._count.customLists; bv = b._count.customLists; }
      else { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span className="text-gray-300">↕</span>;
    return <span className="text-brand-600">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} registered accounts</p>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-xs">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Filter by email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <button onClick={() => toggleSort('email')} className="flex items-center gap-1.5 hover:text-gray-700">
                    Email <SortIcon col="email" />
                  </button>
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <button onClick={() => toggleSort('watchlist')} className="flex items-center gap-1.5 hover:text-gray-700">
                    Watchlist <SortIcon col="watchlist" />
                  </button>
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <button onClick={() => toggleSort('lists')} className="flex items-center gap-1.5 hover:text-gray-700">
                    Lists <SortIcon col="lists" />
                  </button>
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1.5 hover:text-gray-700">
                    Joined <SortIcon col="createdAt" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">No users found</td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {user.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${ROLE_STYLES[user.role]}`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="font-medium">{user._count.watchlistEntries}</span>
                      <span className="text-gray-400 ml-1">titles</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="font-medium">{user._count.customLists}</span>
                      <span className="text-gray-400 ml-1">lists</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          Showing {filtered.length} of {users.length} users
        </p>
      )}
    </div>
  );
}
