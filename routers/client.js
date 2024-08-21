const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth } = require("../middleware/auth")

const { createClient, getSingleClient, getClientCategory, getAllClients, exportClient, updateClient, updateClientCategory, deleteClient, clientImport, bulkClientDelete } = require("../controllers/client")

router.post("/create",
    auth,
    createClient
)

router.post("/client-import", auth, clientImport)

router.get("/client-list", auth, getAllClients)

router.get("/clients-without-pagination", auth, exportClient)

router.get("/single-client/:id", auth, getSingleClient)

router.get("/client-category/:id", auth, getClientCategory)

router.put("/update/:id", auth, updateClient)

router.put("/update-client-category/:id", auth, updateClientCategory)

router.delete("/delete-client/:id", auth, deleteClient)

router.post("/bulk-delete", auth, bulkClientDelete)

module.exports = router