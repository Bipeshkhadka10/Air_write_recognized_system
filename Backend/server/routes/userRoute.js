const express = require('express');
const router = express.Router();
const User = require('../model/user');
const{getAllUsers, createUser,updateUser,deleteUser,loginUser, logOut, getProfile, changePassword,handleForgetPassword,resetPassword, verifyCode}= require('../controller/userController')
const {authValidation} = require('../middleware/authMiddleWare')
const upload = require('../middleware/multerMiddleware')
// Route to get all users
router.get('/users',getAllUsers.bind(this));

// Route to get a user profile
router.get('/user/profile',authValidation,getProfile)
// route to update user details
router.put('/user/profile/change-password',authValidation,changePassword)
// Route to create a new user
router.post('/user/register',createUser);
//Route to update user details
router.put('/user/profile/edit',authValidation,upload.single('avatar'),updateUser);
//Router to delete a user
router.delete('/user/profile/delete',authValidation,deleteUser);
//Router to login a user
router.post('/user/login',loginUser);
//Router to logout a user
router.post('/user/logout',logOut)


// Email verification and email sending
router.post("/auth/verify-code", verifyCode);
router.post("/auth/forgot-password", handleForgetPassword);
router.post("/auth/reset-password", resetPassword);

module.exports = router;