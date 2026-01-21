const express = require('express');
const router = express.Router();
const Note = require('../model/note');
const{getAllNotes, createNote,updateNote,deleteNote}= require('../controller/noteController')

// Route to get all Notes
router.get('/Notes',getAllNotes.bind(this));
// Route to create a new Note
router.post('/Note',createNote.bind(this));
//Route to update Note details
router.put('/Note/:id',updateNote.bind(this));
//Router to delete a Note
router.delete('/Note/:id',deleteNote.bind(this));


module.exports = router;