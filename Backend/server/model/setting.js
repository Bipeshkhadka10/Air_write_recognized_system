const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.types.ObjectId,
        ref:'User'
    },
    gestureSensitivity:{
        type:Number,
        default:5,
    },
    theme:{
        type:String,
        default:'light',
    },
    canvasSize:{
        type:String,
        default:'medium',
    }

})

const Setting = mongoose.model('Settting',settingSchema);
module.exports = Setting;
