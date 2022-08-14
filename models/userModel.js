const mongoose = require('mongoose');
const moment = require('moment');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    name: {
        type: String,
        default: null
    },
    age: {
        type: Number,
        default: null
    },
    company: {
        type: String,
        default: null
    },
    password: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isUpdated: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;