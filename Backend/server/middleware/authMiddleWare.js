    const jwt = require('jsonwebtoken');
    const User = require('../model/user')
    require('dotenv').config()

    const authValidation = async (req, res, next)=>{
        // getting token form cookies
        const token = req.cookies.jwt;
        
        if(token){
            try {
                const decode = jwt.verify(token,process.env.PRIVATE_KEY);
                req.user = await User.findById(decode.userId).select('-password')
                next();
            } catch (error) {
                res.status(401).json({message:'Not authorized, invalide token'})
            }
        }else
        {
            return res.status(401).json({message:'Not authorized, no token'})
        }

    
    }

    module.exports = {authValidation};