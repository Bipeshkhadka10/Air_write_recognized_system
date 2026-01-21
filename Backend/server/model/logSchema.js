const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    inputImagePath:{
        type:String,
        
    },
    prededictedText:{
        type:String,
        required:true,
    },
    confidenceScore:{
        type:Number
        
    },
    timestamp:{
        type:Date,
        default:Date.now,
    }
})


const Log = mongoose.model('Log',logSchema);

module.exports = Log;
