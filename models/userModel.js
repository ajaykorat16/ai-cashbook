const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        minlength: 8
    },
    phone: {
        type: String,
    },
    active: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    verified: {
        type: Boolean,
        default: false
    },
    token: {
        type: String
    }
}, {
    timestamps: true,
});

const Users = mongoose.model("User", userSchema);

module.exports = Users;
