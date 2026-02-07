const Note = require('../model/note');
const User = require('../model/user');

// Controller to get all Notes
exports.getAllNotes = async(req,res)=>{
    try {
        const response = await Note.find({userId:req.user?._id});
        if(response){
            res.status(200).json({
                message:"Notes fetched successfully",
                data:response
            })
        }else{
            res.status(404).json({
                message:"no Notes found",
                data:[]
            })
        };
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message, 
        })        
    }
}

// controller to create a new Note
exports.createNote = async(req,res)=>{
    try {
        // const userId = req.user._id;
        const {title,recognizedText,strokeImagePath,userId} = req.body;
        if(!title){
            return res.status(400).json({
                message:"Title is required"
            })
        }
        const newNote = new Note({title,recognizedText,strokeImagePath,userId:userId});       
        const response = await newNote.save();
        if(response){
            res.status(201).json({
                message:"Note created successfully",
                data:response,
            })
        }

    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message,
        })
    }
}

// controller to update user details
exports.updateNote = async(req,res)=>{
    try {
        const userId = req.user._id;
        const NoteId = req.params.id;
        const updates = {};
        //Dynamic updates
        const allowedUpdates = ['title','recognizedText','strokeImagePath'];
       for(const key of allowedUpdates){
        if(req.body[key]!== undefined){
            updates[key]=req.body[key];
        }
       }

    //    validating the Note ownership
    const note = await Note.findById(NoteId);
    if(!note || note.userId?.toString() !== userId.toString()){
        return res.status(404).json({
            message:"Note not found or you are not authorized to update this Note"
        })
    } 

       const response = await Note.findByIdAndUpdate(NoteId,updates,{
                new:true,
                runValidators:true,
            });
        if(response){
            res.status(200).json({
                message:"Note updated successfully",
                data:response
            })
        }else{
            res.status(404).json({
                message:"Note not found",
                data:null
            })
        }
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message,
        })
    }
}


// controller to delete a note
exports .deleteNote = async(req,res)=>{
    try {
        const userId = req.user.userId;
        const noteId =req.params.id;
        
        const response =await Note.findByIdAndDelete(noteId);

        //    validating the Note ownership
        if(!response || response.userId?.toString() !== userId.toString()){
        return res.status(404).json({
            message:"Note not found or you are not authorized to update this Note"
        })
    } 
        if(response){
            res.status(200).json({
                message:"Note deleted successfully",
                data:response
            })
        }else{
            res.status(404).json({
                message:"Note not found, Invalid NoteID"
            })
        }
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}



// controller to get recent notes

exports.getRecentNotes = async(req,res)=>{
    try {
        const response = await Note.find({userId : req.user._id}).sort({createdAt:-1});
         res.status(200).json({
            message:"Recent Notes fetched successfully",
            data:response
            })
        
        
        }
     catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
        }
}