const mongoose = require('mongoose');
const  bcrypt = require('bcrypt');
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
    bio:{
        type:String,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyCode: String,
    verifyCodeExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  
},{timestamps:true})
 
userSchema.pre('save', async function() {
    if(!this.isModified('password')) return ;
    
   try {
    //generate salt for hashing
    const generatedSalt =  await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,generatedSalt);
    

   } catch (error) {
    throw error;
   }
})


userSchema.methods.comparePasswords = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password)
}



// Generate verification code
userSchema.methods.generateVerifyCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  this.verifyCode = code;
  this.verifyCodeExpire = Date.now() + 5 * 60 * 1000; // 5 min

  return code;
};


// Generate reset password token
userSchema.methods.generateResetToken = function () {
  const crypto = require("crypto");

  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min

  return resetToken;
};

const User = mongoose.model('User',userSchema);

module.exports = User;