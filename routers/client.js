const express = require('express');
const router = express.Router();
const { auth } = require("../middleware/auth")

const { createClient, getSingleClient, getClientCategory, getAllClients, exportClient, updateClient, updateClientCategory, getSpreadsheet, getLastClient,
    deleteClient, clientImport, bulkClientDelete, createClientSpreadsheet, updateClientSpreadsheet } = require("../controllers/client")

router.get("/", auth, getAllClients)

router.get("/clients-without-pagination", auth, exportClient)

router.get("/lastclient-code", auth, getLastClient)

router.get("/:id", auth, getSingleClient)

router.get("/category/:id", auth, getClientCategory)

router.get("/spreasheet/:id", auth, getSpreadsheet)

router.post("/create", auth, createClient)

router.post("/create-spreasheet/:id", auth, createClientSpreadsheet)

router.post("/import", auth, clientImport)

router.post("/bulk-delete", auth, bulkClientDelete)

router.put("/update/:id", auth, updateClient)

router.put("/update-category/:id", auth, updateClientCategory)

router.put("/update-spreasheet/:id", auth, updateClientSpreadsheet)

router.delete("/delete/:id", auth, deleteClient)


module.exports = router