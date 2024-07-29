const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth } = require("../middleware/auth")

const { createClient, getSingleClient, getClientCategory, getAllClients, updateClient, updateClientCategory, deleteClient } = require("../controllers/client")

router.post("/create",
    check('user_id', 'User Id is required.').notEmpty(),
    auth,
    createClient
)

router.get("/client-list", auth, getAllClients)

router.get("/single-client/:id", auth, getSingleClient)

router.get("/client-category/:id", auth, getClientCategory)

router.put("/update/:id", auth, updateClient)

router.put("/update-client-category/:id", auth, updateClientCategory)

router.delete("/delete-client/:id", auth, deleteClient)

module.exports = router