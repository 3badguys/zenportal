
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import PostPage from './pages/PostPage';
import AdminPage from './admin/AdminPage';
import AdminGuard from './admin/AdminGuard';

const adminPath = import.meta.env.VITE_ADMIN_SECRET_PATH || 'my-admin-path';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/posts/:slug" element={<PostPage />} />
      </Route>
      <Route path={`/${adminPath}/*`} element={<AdminGuard><AdminPage /></AdminGuard>} />
    </Routes>
  );
}
