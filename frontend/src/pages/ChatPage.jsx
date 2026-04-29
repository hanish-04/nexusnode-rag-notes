// src/pages/ChatPage.jsx
import { useState, useRef, useEffect } from 'react';
import apiClient from '../api/client';
import { Send, User, Bot, Loader2, Trash2, Plus, Edit3 } from 'lucide-react';

export default function ChatPage() {
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Reference to automatically scroll to the bottom of the chat
    const messagesEndRef = useRef(null);
    const activeChat = chats.find((chat) => chat._id === activeChatId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const loadChatMessages = async (chatId) => {
        if (!chatId) return;
        try {
            const response = await apiClient.get('/ai/chat/history', {
                params: { chatId },
            });
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        }
    };

    const handleCreateChat = async () => {
        try {
            setIsCreating(true);
            const response = await apiClient.post('/ai/chat/new', { title: 'New Chat' });
            const newChat = response.data;
            setChats((prev) => [newChat, ...(prev || [])]);
            setActiveChatId(newChat._id);
            setMessages(newChat.messages || [{ role: 'ai', content: 'Hello! I am your NexusNode AI. Ask me anything about your saved notes.' }]);
        } catch (error) {
            console.error('Failed to create a new chat:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const loadChats = async () => {
        try {
            const response = await apiClient.get('/ai/chat');
            const chatList = response.data;

            if (!chatList || chatList.length === 0) {
                await handleCreateChat();
                return;
            }

            setChats(chatList);
            setActiveChatId(chatList[0]._id);
            await loadChatMessages(chatList[0]._id);
        } catch (error) {
            console.error('Failed to load chats:', error);
        }
    };

    const handleSelectChat = async (chatId) => {
        if (chatId === activeChatId) return;
        setActiveChatId(chatId);
        await loadChatMessages(chatId);
    };

    useEffect(() => {
        loadChats();
    }, []);

    const handleClearChat = async () => {
        if (!activeChatId) return;
        if (!window.confirm('Are you sure you want to clear this chat?')) return;

        try {
            await apiClient.delete('/ai/chat/history', { params: { chatId: activeChatId } });
            setMessages([{ role: 'ai', content: 'Hello! I am your NexusNode AI. Ask me anything about your saved notes.' }]);
        } catch (error) {
            console.error('Failed to clear chat:', error);
        }
    };

    const handleRenameChat = async () => {
        if (!activeChatId || !activeChat) return;

        const newTitle = window.prompt('Enter a new chat title', activeChat.title || '');
        if (!newTitle || !newTitle.trim()) return;

        try {
            const response = await apiClient.put(`/ai/chat/${activeChatId}`, {
                title: newTitle.trim(),
            });
            setChats((prev) => prev.map((chat) => (chat._id === activeChatId ? { ...chat, title: response.data.title } : chat)));
        } catch (error) {
            console.error('Failed to rename chat:', error);
        }
    };

    const handleDeleteChat = async () => {
        if (!activeChatId || !activeChat) return;
        if (!window.confirm(`Delete chat "${activeChat.title || 'Untitled chat'}"? This cannot be undone.`)) return;

        try {
            await apiClient.delete(`/ai/chat/${activeChatId}`);
            const updatedChats = chats.filter((chat) => chat._id !== activeChatId);
            setChats(updatedChats);

            if (updatedChats.length > 0) {
                setActiveChatId(updatedChats[0]._id);
                await loadChatMessages(updatedChats[0]._id);
            } else {
                await handleCreateChat();
            }
        } catch (error) {
            console.error('Failed to delete chat:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!query.trim() || !activeChatId) return;

        const userMessage = query.trim();
        setQuery('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await apiClient.post('/ai/chat', {
                query: userMessage,
                chatId: activeChatId,
            });

            console.log('CHUNKS RETRIEVED BY MATH FUNCTION:', response.data.contextUsed);

            setMessages((prev) => [...prev, { role: 'ai', content: response.data.answer }]);
        } catch (error) {
            const fallbackMessage = {
                role: 'ai',
                content:
                    error.response?.status === 503
                        ? '🤖 AI service is temporarily busy due to high demand. Please try again in a few minutes.'
                        : '⚠️ Sorry, I encountered an error connecting to the server. Please check the console.',
            };
            console.error('Chat Error:', error);
            setMessages((prev) => [...prev, fallbackMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto mt-4 h-[80vh] flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <aside className="w-80 border-r border-gray-200 bg-slate-50 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                            <h2 className="text-lg font-semibold">Chats</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleCreateChat}
                            disabled={isCreating}
                            className="inline-flex items-center justify-center rounded-full border border-transparent bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                            title="Create new chat"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {chats.length === 0 && (
                        <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                            No chats yet. Create one to start.
                        </div>
                    )}

                    {chats.map((chat) => (
                        <button
                            key={chat._id}
                            type="button"
                            onClick={() => handleSelectChat(chat._id)}
                            className={`w-full text-left rounded-2xl px-4 py-3 transition ${chat._id === activeChatId ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-medium truncate">{chat.title || 'New Chat'}</span>
                                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-blue-500">{chat.messageCount || 0}</span>
                            </div>
                            {chat.lastMessage && (
                                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{chat.lastMessage.content}</p>
                            )}
                        </button>
                    ))}
                </div>
            </aside>

            <div className="flex-1 flex flex-col">
                <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bot className="text-blue-400" />
                        <div>
                            <h2 className="font-bold text-lg">{activeChat?.title || 'NexusNode AI'}</h2>
                            <p className="text-xs text-gray-400">Powered by Gemini & Local RAG</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRenameChat}
                            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Rename Current Chat"
                        >
                            <Edit3 size={18} />
                        </button>
                        <button
                            onClick={handleDeleteChat}
                            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete Current Chat"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={handleClearChat}
                            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-yellow-400 transition-colors"
                            title="Clear Current Chat"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                    <Bot size={18} className="text-blue-600" />
                                </div>
                            )}

                            <div
                                className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                                    <User size={18} className="text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4 justify-start">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                <Bot size={18} className="text-blue-600" />
                            </div>
                            <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-blue-600" />
                                <span className="text-sm text-gray-500">Searching your notes...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex gap-3 max-w-3xl mx-auto relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask a question about your notes..."
                            disabled={isLoading}
                            className="flex-1 pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50 text-gray-800"
                        />
                        <button
                            type="submit"
                            disabled={!query.trim() || isLoading}
                            className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center justify-center"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
