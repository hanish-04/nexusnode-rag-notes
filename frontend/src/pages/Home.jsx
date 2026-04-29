// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Plus, Trash2, Edit, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const auth = useAuth();
    const navigate = useNavigate();

    const fetchNotes = async () => {
        try {
            const { data } = await apiClient.get('/notes');
            setNotes(data);
        } catch (error) {
            console.error("Failed to fetch notes", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        
        try {
            await apiClient.delete(`/notes/${id}`);
            setNotes(notes.filter(note => note._id !== id));
        } catch (error) {
            console.error("Failed to delete note", error);
        }
    };

    if (isLoading) return <div className="text-center mt-10">Loading notes...</div>;

    return (
        <div className="max-w-5xl mx-auto mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Notes</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link 
                        to="/new" 
                        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <Plus size={20} /> New Note
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            auth.logout();
                            navigate('/login');
                        }}
                        className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No notes yet</h3>
                    <p className="text-gray-500 mb-4">Create your first note to start chatting with your AI.</p>
                    <Link to="/new" className="text-blue-600 font-medium hover:underline">
                        Write a note &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map((note) => (
                        <div key={note._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-48 hover:shadow-md transition-shadow group">
                            <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">
                                {note.title}
                            </h2>
                            {/* We strip HTML tags for a clean preview snippet */}
                            <p className="text-gray-500 flex-1 line-clamp-3 text-sm">
                                {note.content.replace(/<[^>]*>?/gm, ' ')}
                            </p>
                            
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-gray-400">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                    <Link 
                                        to={`/edit/${note._id}`}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    >
                                        <Edit size={16} />
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(note._id)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}