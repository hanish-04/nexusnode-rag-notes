// models/Note.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String, // Will store HTML or JSON from Tiptap
        required: true
    },
    chunks: {
        type: [String],
        default: []
    },
    embeddings: {
        type: [[Number]], // Array of arrays of numbers (vectors)
        default: []
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Note', noteSchema);