// src/pages/EditorPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import apiClient from '../api/client';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function EditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!!id);

    // Initialize Tiptap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing your note here...',
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px]',
            },
        },
    });

    // Fetch note if in "Edit" mode
    useEffect(() => {
        if (id) {
            const fetchNote = async () => {
                try {
                    // Our backend currently doesn't have a GET /notes/:id route, 
                    // so we fetch all and filter for MVP. 
                    // (In a production app, you'd add a specific backend route for this).
                    const { data } = await apiClient.get('/notes');
                    const note = data.find(n => n._id === id);
                    if (note) {
                        setTitle(note.title);
                        editor?.commands.setContent(note.content);
                    }
                } catch (error) {
                    console.error("Failed to fetch note", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchNote();
        }
    }, [id, editor]);

    const handleSave = async () => {
        if (!title.trim() || !editor?.getHTML()) return;

        setIsSaving(true);
        try {
            const payload = {
                title,
                content: editor.getHTML()
            };

            if (id) {
                await apiClient.put(`/notes/${id}`, payload);
            } else {
                await apiClient.post('/notes', payload);
            }
            navigate('/'); // Go back to home after saving
        } catch (error) {
            // Extract the exact error message sent from our Express backend
            const exactError = error.response?.data?.error || error.response?.data?.message || error.message;

            console.error("Full Error Object:", error);
            console.error("Exact Backend Error:", exactError);

            // Show the actual error to the user on the screen
            alert(`Failed to save note:\n\n${exactError}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="text-center mt-10">Loading note...</div>;

    return (
        <div className="max-w-3xl mx-auto mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            {/* Header / Controls */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !title.trim()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSaving ? 'Saving...' : 'Save Note'}
                </button>
            </div>

            {/* Note Title Input */}
            <input
                type="text"
                placeholder="Note Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-4xl font-bold border-none outline-none placeholder-gray-300 mb-6 text-gray-800"
            />

            {/* Tiptap Toolbar (Minimal MVP) */}
            {editor && (
                <div className="flex gap-2 mb-4 p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`px-3 py-1 rounded font-bold ${editor.isActive('bold') ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        B
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`px-3 py-1 rounded italic ${editor.isActive('italic') ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        I
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`px-3 py-1 rounded font-semibold ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        H2
                    </button>
                </div>
            )}

            {/* Tiptap Editor Area */}
            <div className="prose-wrapper cursor-text">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}