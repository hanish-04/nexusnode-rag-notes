// routes/notes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getNotes,
    createNote,
    updateNote,
    deleteNote
} = require('../controllers/noteController');

router.use(authMiddleware);

router.route('/')
    .get(getNotes)
    .post(createNote);

router.route('/:id')
    .put(updateNote)
    .delete(deleteNote);

module.exports = router;