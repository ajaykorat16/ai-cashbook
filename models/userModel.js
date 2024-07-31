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
    role: {
        type: String,
        default: "user"
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
