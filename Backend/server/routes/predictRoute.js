const express = require('express');
const router = express.Router();
const { predictCharacter, mlHealthCheck } = require('../controller/predictController');
// const { protect } = require('../middleware/authMiddleware'); // uncomment once auth middleware is wired up
const { getStats } = require('../controller/predictStats');

router.post('/predict', predictCharacter);
router.get('/predict/health', mlHealthCheck);
router.get('/predict/stats', getStats);

module.exports = router;

