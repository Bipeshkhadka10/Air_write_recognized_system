const User = require('../model/user');
require('dotenv').config();
const asyncHandler = require('express-async-handler');
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
         const {name,email,password} = req.body;
        const avatar = req.file?req.file.path:null;
        
        if(!name || !email || !password ){
            res.status(400).json({message:"name,email and password are required"})
        }

       // check if user already exists
       if(await User.findOne({email:email})){
            res.status(409).json({message:"user with this email already exists"})
        };

       const newUser  = new User({
        name,
        email,
        password,
        avatar
       })
        const response = await newUser.save();
        if(response){
            // jwt token generation
            generateToken(res, response._id);
            const userData = response.toObject();       // to remove password from response so it's not visible to client
            delete userData.password;
            res.status(201).json({
                message:"user created successfully",
                data:userData,
                
            })
        }
       } catch (error) {
            res.status(500).json({error:"internal server error",
            error:error.message
        })
       } 
       
}

// controller to get user profile
exports.getProfile= async(req,res)=>{
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');
        if(user){
            res.status(200).json({
                message:"user data fetched successfully",
                data:user
            })
        }else{
            res.status(404).json({
                message:"user not found"
            })
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
        const userId = req.params.id;

        const updates = {};

        if(req.body.name){
            updates.name = req.body.name;
        }
        if(req.body.email){
            updates.email = req.body.email;
        }
        if(req.file){
            updates.avatar = req.file.path;
        }

        const response = await User.findByIdAndUpdate(userId,updates,{
            new:true,
            runValidators:true
        });
        if(response){
            const userData = response.toObject();       // to remove password from response so it's not visible to client
            delete userData.password;
            res.status(200).json({
                message:"user updated successfully",
                data:userData
            })
        }else{
            res.status(404).json({
                message:"user not found",
                data:null
            })
        }
    }catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message,
        })
    }
}



// controller to delete a user
exports .deleteUser = async(req,res)=>{
    try {
        const userId =req.params.id;
        if(await User.findById(userId)){
            const response =await User.findByIdAndDelete(userId);
            const userData = response.toObject();       // to remove password from response so it's not visible to client
            delete userData.password;
            res.status(200).json({
                message:"user deleted successfully",
                data:userData
            })
        } 
        else{
            res.status(404).json({
                message:"user not found, Invalid userID"
            })
        }
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
                
                const isPasswordMatch = await user.comparePasswords(password);
                if(!isPasswordMatch || !user){
                    return res.status(401).json({
                        message:"invalid email or password"
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