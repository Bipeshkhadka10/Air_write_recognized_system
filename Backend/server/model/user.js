const mongoose = require('mongoose');
const  bcrypt = require('bcrypt');
const { exists } = require('./note');
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    avatar:{
        type:String,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
})
 
userSchema.pre('save', async function() {
    if(!this.isModified('password')) return exists(1);
    
   try {
    //generate salt for hashing
    const generatedSalt =  await bcrypt.genSalt(15);
    this.password = await bcrypt.hash(this.password,generatedSalt);
    

   } catch (error) {
    (error);
   }
})


userSchema.methods.comparePasswords = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password)
}


const User = mongoose.model('User',userSchema);

module.exports = User;