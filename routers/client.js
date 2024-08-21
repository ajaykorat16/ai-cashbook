const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth } = require("../middleware/auth")

const { createClient, getSingleClient, getClientCategory, getAllClients, exportClient, updateClient, updateClientCategory, deleteClient, clientImport, bulkClientDelete } = require("../controllers/client")

router.get("/", auth, getAllClients)

router.get("/clients-without-pagination", auth, exportClient)

router.get("/:id", auth, getSingleClient)

router.get("/category/:id", auth, getClientCategory)

router.post("/create",
    auth,
    createClient
)

router.post("/import", auth, clientImport)

router.post("/bulk-delete", auth, bulkClientDelete)

router.put("/update/:id", auth, updateClient)

router.put("/update-category/:id", auth, updateClientCategory)

router.delete("/delete/:id", auth, deleteClient)


module.exports = router