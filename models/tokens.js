const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    token: {
        type: Number,
        required: true
    },
    expireAt: {
        type: Number
    }
}, {timestamps: true});

const tokenModel = mongoose.model('Token table', tokenSchema);
module.exports = tokenModel;