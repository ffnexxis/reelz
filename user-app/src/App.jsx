import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Watchlist from './pages/Watchlist';
import Lists from './pages/Lists';
import TitleDetail from './pages/TitleDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import People from './pages/People';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationsProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
                  <Route path="/lists" element={<ProtectedRoute><Lists /></ProtectedRoute>} />
                  <Route path="/title/:tmdbId" element={<ProtectedRoute><TitleDetail /></ProtectedRoute>} />
                  <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                  <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
                  <Route path="/users/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/posts/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                </Routes>
              </main>
            </div>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
