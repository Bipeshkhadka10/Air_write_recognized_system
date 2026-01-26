const express = require('express');
const router = express.Router();
const User = require('../model/user');
const{getAllUsers, createUser,updateUser,deleteUser,loginUser, logOut, getProfile}= require('../controller/userController')
const {authValidation} = require('../middleware/authMiddleWare')
// Route to get all users
router.get('/users',getAllUsers.bind(this));

// Route to get a user profile
router.get('/user/profile/:id',authValidation,getProfile)
// Route to create a new user
router.post('/user/register',createUser);
//Route to update user details
router.put('/user/profile/edit/:id',authValidation,updateUser);
//Router to delete a user
router.delete('/user/delete/:id',authValidation,deleteUser);
//Router to login a user
router.post('/user/login',loginUser);
//Router to logout a user
router.post('/user/logout',logOut)

module.exports = router;