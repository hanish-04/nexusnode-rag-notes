import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      auth.login(response.data.user, response.data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-3xl shadow-lg border border-gray-200">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900">Sign in to NexusNode</h1>
      {error && <div className="mb-4 p-3 text-sm bg-red-50 text-red-700 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="mt-6 text-sm text-gray-500">
        Don’t have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
      </p>
    </div>
  );
}
