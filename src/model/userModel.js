const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        // unique: true
    },
    profileImage: {
        type: String,
        required: true,
    }, // s3 link
    phone: {
        type: String,
        required: true,
        trim: true

    },
    password: {
        type: String,
        required: true,

    }
}, { timestamps: true })


module.exports = mongoose.model('User', userSchema);