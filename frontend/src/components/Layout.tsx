import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gray-900 hover:text-gray-700">
            ZenPortal
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className={`hover:text-gray-900 ${isHome ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Home</Link>
            <Link to="/blog" className={`hover:text-gray-900 ${location.pathname.startsWith('/blog') || location.pathname.startsWith('/posts') ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Blog</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} ZenPortal
      </footer>
    </div>
  );
}
