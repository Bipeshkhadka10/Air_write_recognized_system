const User = require('../model/user');
require('dotenv').config();
const sendEmail = require('../utils/nodeMailer')
const {verifyEmailTemplate,welcomeEmail,resetPasswordTemplate} = require('../utils/emailTemplets')
const generateToken = require('../utils/jwtToken');

// Controller to get all users
exports.getAllUsers =async (req, res) => {
    try {

        const response = await User.find();
        if(response){
            res.status(200).json({
                message: "users fetched successfully",
                data:response.map(user => {
                return {
                    "_id": user._id,
                    "name": user.name,
                    "email": user.email,
                    "avatar": user.avatar,
                    "bio": user.bio,
                    "createdAt": user.createdAt,
                };
            })
            })
        } else {
            res.status(404).json({message:'No users found'});
            }       
        
    } catch (error) {
        res.status(500).json({
            error:'internal server error',
            error:error.message
        })
    }
};


// controller to create a new user
exports.createUser =async(req,res)=>{
       try {
         const {name,email,password,bio} = req.body;
        const avatar = req.file?`/uploads/${req.file.filename}`:null;
        
        if(!name || !email || !password ){
            return res.status(400).json({message:"name,email and password are required"})
        }

       // check if user already exists
       if(await User.findOne({email:email})){
            return res.status(409).json({message:"user with this email already exists"})
        };

       const newUser  = new User({
        name,
        email,
        password,
        avatar,
        bio
       });

       // ✅ Generate verification code
        const code = newUser.generateVerifyCode();

//         const response = await newUser.save();
//         if(response){
//             // jwt token generation
//             generateToken(res, response._id);
//             const userData = response.toObject();       // to remove password from response so it's not visible to client
//             delete userData.password;
//             res.status(201).json({
//                 message:"user created successfully",
//                 data:userData,
                
//             })
//         }
//        } catch (error) {
//             res.status(500).json({error:"internal server error",
//             error:error.message
//         })
//        } 
       
// }    


       await newUser.save();
    
    //  Send verification email
    await sendEmail(email, verifyEmailTemplate(name, code));
    //  Send welcome email now
    // await sendEmail(newUser.email, welcomeEmail(newUser.name));
    return res.status(201).json({
      message: "User created. Please verify your email",
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// controller to get user profile
exports.getProfile= async(req,res)=>{
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('-password');
        if(!user){
            return res.status(404).json({message:"user not found"})
        }
        else{
            res.status(200).json({
            message:"user profile fetched successfully",
            data:user
        });
        }
        
    } catch (error) {
        res.status(500).json({message:"internal server error",
            error:error.message
        })
    }
}

// controller to update user details
exports.updateUser =async(req,res)=>{
    try {
        const userId = req.user._id;

        const updates = {};

        if(req.body.name){
            updates.name = req.body.name;
        }
        if(req.body.email){
            updates.email = req.body.email;
        }
        if(req.file){
            updates.avatar = `/uploads/${req.file.filename}`;
            console.log("new avatar path",updates.avatar);
        }
        if(req.body.bio){
            updates.bio = req.body.bio;
        }
        console.log("file data",updates.avatar);

        const response = await User.findByIdAndUpdate(userId,updates,{
            new:true,
            runValidators:true
        });
        if(response){
            const userData = response.toObject();       // to remove password from response so it's not visible to client
            delete userData.password;
            res.status(200).json({
                message:"Profile updated successfully",
                data:userData
            })
        }
    }catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message,
        })
    }
}

// controller to change password
exports.changePassword = async(req,res)=>{
    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        const userId = req.user._id;
        
        const {password:currentPassword, newPassword} = req.body;
        
        if(!currentPassword || !newPassword){
           
            return res.status(400).json({
                message:"current password and new password are required"
            }) 
        }else if(currentPassword === newPassword){
           
            return res.status(400).json({
                message:"new password must be different from current password"
            })
        }else if(!passwordRegex.test(newPassword)){
           
            return res.status(400).json({
                message:"new password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            })
            
        }
        
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message:"user not found"
            })
        }
        const isPasswordMatch = await user.comparePasswords(currentPassword);
        if(!isPasswordMatch){
            return res.status(401).json({
                message:"current password is incorrect"
            })
        }
        
        user.password = newPassword;
        await user.save();

        res.cookie('jwt','',{
            httpOnly:true,
            expires: new Date(0)
        })
        res.status(200).json({
            message:"password changed successfully"
        })
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}

// controller to delete a user
exports.deleteUser = async(req,res)=>{
    try {
        const userId =req.user._id;
        await User.findByIdAndDelete(userId);
        res.cookie("jwt","",{
            httpOnly:true,
            expires:new Date(0)
        });
            res.status(200).json({
                message:"Account deleted successfully",
                data:null
            })
        
       
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
}

//controller to login user
exports.loginUser =async(req,res)=>{
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                message:"email and password are required"
            })
        }
        else{
                const user = await User.findOne({email:email});
                if(!user){
                    return res.status(404).json({
                        message:"user not found with this email"
                    })
                }
                if (!user.isVerified) {
                    return res.status(401).json({
                        message: "Please verify your email first",
                    });
                }
                
                const isPasswordMatch = await user.comparePasswords(password);
                if(!isPasswordMatch || !user){
                    return res.status(401).json({
                        message:"invalid password"
                    })
                }

                // jwt token generation
                generateToken(res,user._id);


                //remove password from user object before sending response
                const userData = user.toObject();
                delete userData.password ;

                res.status(200).json({
                    message:"user logged in successfully",
                    data:userData,
                })
            }
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message,
        })
    }
}

exports.logOut = async(req,res)=>{
    try {
        res.cookie('jwt','',{
            httpOnly:true,
            expires: new Date(0)
        })

        res.status(200).json({message:"user logout successfully"})
    } catch (error) {
        res.status(500).json({error:"internal server error"})
    }
}





exports.verifyCode = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email: email,
    verifyCode: String(otp),
    verifyCodeExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  user.isVerified = true;
  user.verifyCode = null;
  user.verifyCodeExpire = null;

  await user.save();

  generateToken(res, user._id);

  await sendEmail(user.email, welcomeEmail(user.name));

  return res.status(200).json({
    message: "Email verified successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

exports.handleForgetPassword = async (req, res) => {
  try {
    const { email } = req.body; // take email

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const code= user.generateVerifyCode();
    await user.save();

    // Send verification email
    await sendEmail(email, resetPasswordTemplate(user.name, code));

    res.json({ message: "Reset code sent" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { code, newPassword } = req.body;

  const user = await User.findOne({
    verifyCode: code,
    verifyCodeExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  user.password = newPassword;
  user.verifyCode = null;
  user.verifyCodeExpire = null;

  await user.save();

  res.json({ message: "Password reset successful" });
};



exports.resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "User already verified",
      });
    }

    const code = user.generateVerifyCode();

    await user.save();

    await sendEmail(email, verifyEmailTemplate(user.name, code));

    return res.status(200).json({
      message: "Verification code resent successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};