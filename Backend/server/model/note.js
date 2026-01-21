const mongoose = require('mongoose');
const User = require('./user');

const noteSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:User
    },
    title:{
        type:String,
        required:true,
    },
    recognizedText:{
        type:String,

    },
    strokeImagePath:{
        type:String,
    },
   
    createdAt:{
        type:Date,
        default:Date.now,
    },
    updatedAt:{
        type:Date,
        default:Date.now,
    }
})



const Note = mongoose.model('Note',noteSchema);
module.exports = Note;