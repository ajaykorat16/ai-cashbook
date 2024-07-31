const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
    first_name: {
        type: String,
        trim: true
    },
    last_name: {
        type: String,
        trim: true
    },
    entity_name: {
        type: String,
        trim: true
    },
    user_id: {
        type: mongoose.ObjectId,
        ref: "User",
        required: true,
    },
    abn_number: {
        type: String,
        trim: true
    },
    preferred_name: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
    },
    email: {
        type: String,
    },
    client_code: {
        type: String,
        trim: true,
    },
    user_defined: {
        type: String,
        trim: true
    },
    address: {
        type: String
    }
}, {
    timestamps: true,
});

const Clients = mongoose.model("Client", clientSchema);

module.exports = Clients;
