import React, { useState, useEffect } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) setAuthenticated(true);
  }, [token]);

  const handleLogin = () => {
    if (!input.trim()) { setError('Enter token'); return; }
    localStorage.setItem('admin_token', input.trim());
    setToken(input.trim());
    setAuthenticated(true);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-center mb-4">Admin Login</h1>
          <input type="password" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Enter admin token" className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
          />
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <button onClick={handleLogin} className="w-full py-2 bg-gray-900 text-white rounded hover:bg-gray-700">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold">⚙️ Admin Dashboard</span>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">Exit</button>
      </div>
      {children}
    </div>
  );
}
