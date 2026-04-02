import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-reelz-600/20 text-reelz-600 dark:text-reelz-400'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-reelz-500 to-purple-600 flex items-center justify-center shadow-lg shadow-reelz-500/30">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
              </svg>
            </div>
            <span className="font-bold text-lg text-gradient">Reelz</span>
          </Link>

          {/* Nav links */}
          {user && (
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>Discover</NavLink>
              <NavLink to="/watchlist" className={navLinkClass}>Watchlist</NavLink>
              <NavLink to="/lists" className={navLinkClass}>My Lists</NavLink>
            </nav>
          )}

          {/* User menu */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-reelz-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Get started</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {user && (
          <nav className="sm:hidden flex items-center gap-1 pb-3">
            <NavLink to="/" end className={navLinkClass}>Discover</NavLink>
            <NavLink to="/watchlist" className={navLinkClass}>Watchlist</NavLink>
            <NavLink to="/lists" className={navLinkClass}>My Lists</NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
