// backend/controllers/aiController.js

const Note = require('../models/Note');
const Chat = require('../models/Chat');
const cosineSimilarity = require('../utils/cosineSimilarity');
const { getEmbedding, generateAnswer } = require('../services/aiService');

const DEFAULT_GREETING = {
  role: 'ai',
  content: 'Hello! I am your NexusNode AI. Ask me anything about your saved notes.',
};

const trimTitle = (text, maxLength = 40) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Chat';
  return cleaned.length <= maxLength ? cleaned : `${cleaned.slice(0, maxLength).trim()}...`;
};

const formatChatSummary = (chat) => ({
  _id: chat._id,
  title: chat.title || 'New Chat',
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt,
  messageCount: chat.messages.length,
  lastMessage: chat.messages.length
    ? chat.messages[chat.messages.length - 1]
    : null,
});

// ================= GET CHAT LIST =================
const getChatList = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json(chats.map(formatChatSummary));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chats', error: error.message });
  }
};

// ================= GET CHAT HISTORY =================
const getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.query;
    let chat;

    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: req.user._id });
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
    } else {
      chat = await Chat.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
      if (!chat) {
        chat = new Chat({ user: req.user._id, messages: [DEFAULT_GREETING] });
        await chat.save();
      }
    }

    res.status(200).json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
};

// ================= CREATE NEW CHAT =================
const createChat = async (req, res) => {
  try {
    const chatCount = await Chat.countDocuments({ user: req.user._id });
    const title = req.body.title || `Chat ${chatCount + 1}`;
    const chat = new Chat({
      user: req.user._id,
      title,
      messages: [DEFAULT_GREETING],
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat', error: error.message });
  }
};

// ================= RENAME CHAT =================
const renameChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const chat = await Chat.findOne({ _id: chatId, user: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.title = title.trim();
    await chat.save();
    res.status(200).json({ _id: chat._id, title: chat.title });
  } catch (error) {
    res.status(500).json({ message: 'Failed to rename chat', error: error.message });
  }
};

// ================= DELETE CHAT =================
const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findOne({ _id: chatId, user: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await Chat.deleteOne({ _id: chatId, user: req.user._id });
    res.status(200).json({ message: 'Chat deleted', chatId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete chat', error: error.message });
  }
};

// ================= MAIN RAG CHAT =================
const chatWithNotes = async (req, res) => {
  try {
    const { query, chatId } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // 🔹 1. Generate embedding for user query
    const queryVector = await getEmbedding(query);

    // 🔹 2. Fetch notes
    const notes = await Note.find({ user: req.user._id });
    if (!notes || notes.length === 0) {
      return res.json({ answer: 'No notes found' });
    }

    let allChunksWithScores = [];

    // 🔹 3. Compare embeddings
    notes.forEach((note) => {
      if (note.embeddings && note.embeddings.length > 0) {
        note.embeddings.forEach((chunkVector, index) => {
          if (!chunkVector) return;
          const score = cosineSimilarity(queryVector, chunkVector);
          allChunksWithScores.push({
            chunkText: note.chunks[index],
            score,
          });
        });
      }
    });

    // 🔹 4. Sort & pick top chunks
    allChunksWithScores.sort((a, b) => b.score - a.score);
    const topChunks = allChunksWithScores.slice(0, 5).map((item) => item.chunkText);
    const retrieved_chunks = topChunks.join('\n\n---\n\n');

    // 🔹 5. Get chat history
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: req.user._id });
    } else {
      chat = await Chat.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
    }

    if (!chat) {
      chat = new Chat({
        user: req.user._id,
        title: 'New Chat',
        messages: [DEFAULT_GREETING],
      });
    }

    const chat_history = chat.messages.length
      ? chat.messages
          .slice(-6)
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join('\n')
      : '';

    // 🔹 6. Prompt
    const prompt = `
You are an AI assistant that helps users understand their notes and also interacts naturally in conversation.

Rules:

If the user greets you (e.g., "hi", "hello", "hey"), respond in a friendly and natural way.
If the user asks general conversational questions (e.g., "how are you"), respond politely.
For academic or topic-based questions:
First, answer using the provided context (notes).
If the user asks follow-up questions on the same topic, you may expand and explain further to improve understanding.
You are allowed to give general explanations related to the topic, even if not fully present in the notes.
However, always prioritize the notes and stay aligned with them.
Do NOT give completely unrelated or random information.
If the topic is not found in the notes and is not a greeting or casual conversation, respond with:
"Not found in notes."
Keep responses clear, helpful, and slightly conversational (not robotic)."

Context:
${retrieved_chunks}

Chat History:
${chat_history}

User Question:
${query}
`;

    // 🔹 7. Generate answer
    const answer = await generateAnswer(prompt);

    // 🔹 8. Save chat
    if (!chat.messages || chat.messages.length === 0) {
      chat.messages = [DEFAULT_GREETING];
    }

    if (!chat.title || /^New Chat|^Chat \d+$/.test(chat.title)) {
      chat.title = trimTitle(query);
    }

    chat.messages.push({ role: 'user', content: query });
    chat.messages.push({ role: 'ai', content: answer });
    await chat.save();

    // 🔹 9. Send response
    res.status(200).json({ answer, contextUsed: topChunks });
  } catch (error) {
    console.error('AI Chat Error:', error);
    if (error.status === 503) {
      return res.status(503).json({
        message: 'AI service is temporarily unavailable due to high demand. Please try again later.',
      });
    }
    res.status(500).json({ message: 'AI chat failed', error: error.message });
  }
};

// ================= CLEAR HISTORY =================
const clearChatHistory = async (req, res) => {
  try {
    const { chatId } = req.query;
    if (chatId) {
      const chat = await Chat.findOne({ _id: chatId, user: req.user._id });
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      chat.messages = [DEFAULT_GREETING];
      await chat.save();
      return res.status(200).json({ message: 'Chat cleared' });
    }

    await Chat.deleteMany({ user: req.user._id });
    res.status(200).json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear history', error: error.message });
  }
};

module.exports = {
  chatWithNotes,
  getChatHistory,
  getChatList,
  createChat,
  renameChat,
  deleteChat,
  clearChatHistory,
};