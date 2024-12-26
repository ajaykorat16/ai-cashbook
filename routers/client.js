const express = require('express');
const router = express.Router();
const { auth } = require("../middleware/auth")

const { createClient, getSingleClient, getClientCategory, getAllClients, exportClient, deleteSpreadSheetData,
    updateClient, updateClientCategory, getSpreadsheet, getLastClient, getClientSpreadsheets, getSpreadsheetData,
    deleteClient, clientImport, bulkClientDelete, createClientSpreadsheet, updateClientSpreadsheet, getSharedClient,
    getGstReport, getItrReport, autoCategorize, changeSheetName, shareSpreadsheet } = require("../controllers/client")

router.get("/", auth, getAllClients)

router.get("/clients-without-pagination", auth, exportClient)

router.get("/lastclient-code", auth, getLastClient)

router.get("/spreadsheet-data", auth, getSpreadsheetData)

router.get("/single-client/:id", auth, getSingleClient)

router.get("/shared-client/:token", getSharedClient)

router.get("/category/:id", getClientCategory)

router.get("/spreadsheet/:id", getSpreadsheet)

router.get("/spreadsheet-list/:id", auth, getClientSpreadsheets)

router.get("/gst-report/:id", auth, getGstReport)

router.get("/itr-report/:id", auth, getItrReport)

router.post("/create", auth, createClient)

router.post("/delete-spreadsheet", auth, deleteSpreadSheetData)

router.post("/change-sheetname/:id", changeSheetName)

router.post("/share-spreadsheet/:id", auth, shareSpreadsheet)

router.post("/create-spreasheet/:id", auth, createClientSpreadsheet)

router.post("/auto-categorize/:id", autoCategorize)

router.post("/import", auth, clientImport)

router.post("/bulk-delete", auth, bulkClientDelete)

router.put("/update/:id", auth, updateClient)

router.put("/update-category/:id", auth, updateClientCategory)

router.put("/update-spreasheet/:id", updateClientSpreadsheet)

router.delete("/delete/:id", auth, deleteClient)


module.exports = router