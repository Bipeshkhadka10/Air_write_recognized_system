const express = require('express');
const router = express.Router();
const { predictCharacter, mlHealthCheck } = require('../controller/predictController')
// const { protect } = require('../middleware/authMiddleware'); // uncomment once auth middleware is wired up

router.post('/predict', predictCharacter);
router.get('/predict/health', mlHealthCheck);

module.exports = router;
