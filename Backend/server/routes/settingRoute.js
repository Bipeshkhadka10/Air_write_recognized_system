const express = require('express');
const router = express.Router();
const settingController = require('../controller/settingController');


// route to get all settings
router.get('/user/setting/edit/:id',settingController.editSettings);