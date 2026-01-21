const express = require('express');
const router = express.Router();
const User = require('../model/user');
const{getAllUsers, createUser,updateUser,deleteUser,loginUser}= require('../controller/userController')

// Route to get all users
router.get('/users',getAllUsers.bind(this));
// Route to create a new user
router.post('/user',createUser.bind(this));
//Route to update user details
router.put('/user/:id',updateUser.bind(this));
//Router to delete a user
router.delete('/user/:id',deleteUser.bind(this));
//Router to login a user
router.post('/user/login',loginUser.bind(this));

module.exports = router;