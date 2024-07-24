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
        type: Number
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

const Users = mongoose.model("User", userSchema);

module.exports = Users;
