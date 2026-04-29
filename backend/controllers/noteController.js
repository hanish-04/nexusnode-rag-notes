// controllers/noteController.js
const Note = require('../models/Note');
const { stripHTML, generateChunks, generateEmbeddings } = require('../services/aiService');

// @desc    Get all notes
// @route   GET /api/notes
const getNotes = async (req, res) => {
    try {
        // Exclude heavy fields like chunks and embeddings for the list view
        const notes = await Note.find({ user: req.user._id }).select('-chunks -embeddings').sort({ createdAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
    }
};

// @desc    Create a new note
// @route   POST /api/notes
const createNote = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        // 1. Process text for AI
        const plainText = stripHTML(content);
        const chunks = generateChunks(plainText, 300); // 300 word limit
        
        // 2. Generate embeddings via Gemini
        const embeddings = await generateEmbeddings(chunks);

        // 3. Save everything to DB
        const note = await Note.create({
            user: req.user._id,
            title,
            content,
            chunks,
            embeddings
        });

        // Don't send heavy arrays back to the client
        res.status(201).json({ 
            _id: note._id, 
            title: note.title, 
            content: note.content,
            createdAt: note.createdAt 
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create note', error: error.message });
    }
};

// @desc    Update a note (UPDATED WITH EMBEDDINGS)
// @route   PUT /api/notes/:id
const updateNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        
        // 1. Re-process text and generate fresh embeddings for updated content
        const plainText = stripHTML(content);
        const chunks = generateChunks(plainText, 300);
        const embeddings = await generateEmbeddings(chunks);
        
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { title, content, chunks, embeddings },
            { new: true } 
        ).select('-chunks -embeddings'); // Exclude heavy arrays from response

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update note', error: error.message });
    }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({ message: 'Note deleted successfully', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete note', error: error.message });
    }
};

module.exports = {
    getNotes,
    createNote,
    updateNote,
    deleteNote
};