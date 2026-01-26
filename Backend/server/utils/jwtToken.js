const jwt = require('jsonwebtoken');
require('dotenv').config();

//testing environement variables
// console.log('private key:',process.env.PRIVATE_KEY);
// console.log('algorithm:',process.env.ALGORITHM);
// console.log('jwt expires:',process.env.JWT_EXPIRE);

// jwt web token generations
const generateToken = (res, userId)=>{
    const token = jwt.sign({userId},process.env.PRIVATE_KEY,{
        algorithm: process.env.ALGORITHM,
        expiresIn : process.env.JWT_EXPIRE,
    })

    res.cookie('jwt',token,{
        httpOnly:true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 1 * 24 * 60 * 60 * 1000,
    })
};


module.exports = generateToken;

