const express = require('express');
const router = express.Router();
const Note = require('../model/note');
const {authValidation} = require('../middleware/authMiddleWare')
const{getAllNotes, createNote,updateNote,deleteNote ,getRecentNotes}= require('../controller/noteController')

// Route to get all Notes
router.get('/notes',authValidation,getAllNotes.bind(this));
// Route to get recent Notes
router.get('/recent',authValidation,getRecentNotes.bind(this));
// Route to create a new Note
router.post('/note',createNote.bind(this));
//Route to update Note details
router.put('/note/:id',authValidation,updateNote.bind(this));
//Router to delete a Note
router.delete('/note/:id',authValidation,deleteNote.bind(this));


module.exports = router;