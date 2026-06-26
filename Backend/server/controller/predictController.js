const axios = require('axios');
const Log = require('../model/logSchema');
require('dotenv').config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

// controller to predict a single character from a stroke image
// expects: { image: "data:image/png;base64,..." }  in req.body
exports.predictCharacter = async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                message: "image is required"
            });
        }

        const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, { image }, {
            timeout: 5000,
        });

        const { char, confidence, low_confidence, error } = mlResponse.data;

        if (error === 'blank_canvas') {
            return res.status(200).json({
                message: "no stroke detected",
                data: { char: null, confidence: 0 }
            });
        }

        // log every prediction for later analysis / accuracy tracking
        await Log.create({
            prededictedText: char,
            confidenceScore: confidence,
        });

        res.status(200).json({
            message: "prediction successful",
            data: { char, confidence, low_confidence }
        });

    } catch (error) {
        // ML service down or unreachable
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
            return res.status(503).json({
                message: "ML service unavailable. Maybe ml_service.py running?",
                error: error.message
            });
        }
        res.status(500).json({
            message: "internal server error",
            error: error.message,
        });
    }
};

// controller to check ML service health (useful for a status indicator in the UI)
exports.mlHealthCheck = async (req, res) => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
        res.status(200).json({
            message: "ML service reachable",
            data: response.data
        });
    } catch (error) {
        res.status(503).json({
            message: "ML service unreachable",
            error: error.message
        });
    }
};
