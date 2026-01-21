const User = require('../model/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');


// Controller to get all users
exports.getAllUsers = async(req,res)=>{
    try {
        const response = await User.find();
        if(response){
            res.status(200).json({
                message:"users fetched successfully",
                data:response
            })
        }else{
            res.status(404).json({
                message:"no users found",
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


// controller to create a new user
exports.createUser = async(req,res)=>{
    
    try {
        
        const {name,email,password} = req.body;
        
        const avatar = req.file?req.file.path:null;
        if(!name || !email || !password ){
            return res.status(400).json({
                message:"name,email and password are required"
            })
        }
        //hasing password here
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const newUser = new User({
            name,email,password:hashedPassword,avatar
        });   
        
        const response = await newUser.save();

        // jwt token generation
        const data = {
            userId:response._id,
            name:response.name,
            email:response.email,
        }
        const token = jwt.sign(data,process.env.PRIVATE_KEY,{
            expiresIn:process.env.JWT_EXPIRE,
            algorithm:process.env.ALGORITHM
        })
        if(response){
            console.log(response);
                const userData = response.toObject();       // to remove password from response so it's not visible to client
                delete userData.password;
            res.status(201).json({
                message:"user created successfully",
                data:userData,
                token:token
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
exports.updateUser = async(req,res)=>{
    try {
        const userId = req.params.id;

        const updates = {};

        if(req.body.name){
            updates.name = req.body.name;
        }
        if(req.body.email){
            updates.email = req.body.email;
        }
        if(req.body.password){
            //hashing password here 
            const saltRounds=10;
            const hashedPassword = await bcrypt.hash(req.body.password,saltRounds);
            updates.password = hashedPassword
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
            res.status(200).json({
                message:"user deleted successfully",
                data:response
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
exports.loginUser = async(req,res)=>{
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
                        message:"user not found"
                    })
                }
                const isPasswordMatch = await bcrypt.compare(password, user.password);
                if(!isPasswordMatch){
                    return res.status(401).json({
                        message:"invalid credentials"
                    })
                }
                // jwt token generation
                const data = {
                    userId:user._id,
                    name:user.name,
                    email:user.email,
                }
                const token = jwt.sign(data,process.env.PRIVATE_KEY,{
                    expiresIn:process.env.JWT_EXPIRE,
                    algorithm:process.env.ALGORITHM
                })

                //remove password from user object before sending response
                const userData = user.toObject();
                delete userData.password;

                res.status(200).json({
                    message:"user logged in successfully",
                    data:userData,
                    token:token
                })
            }
    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message,
        })
    }
}