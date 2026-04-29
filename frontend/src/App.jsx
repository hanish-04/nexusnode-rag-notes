// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { BookText, MessageSquarePlus } from 'lucide-react';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import ChatPage from './pages/ChatPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <BookText className="text-blue-600" />
              NexusNode
            </Link>
            <nav className="flex gap-4">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                My Notes
              </Link>
              <Link 
                to="/chat" 
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                <MessageSquarePlus size={18} />
                Ask AI
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl mx-auto w-full p-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new"
              element={
                <ProtectedRoute>
                  <EditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;