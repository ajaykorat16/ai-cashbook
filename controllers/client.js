const Users = require("../models/userModel");
const Clients = require("../models/clientModel")
const { MongoClient, ObjectId } = require('mongodb');
const mongoClient = new MongoClient(process.env.DATABASE_URL);
const { validationResult } = require('express-validator');
const { isValidEmail, createUserClientCategoryCollection, createBlankSpreadsheet, createSpreadsheetList } = require("../helpers/helper");
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { spawn } = require("child_process");
const crypto = require('crypto');

const createClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { first_name, last_name, entity_name, abn_number, preferred_name, phone, email, client_code, user_defined, address } = req.body
        const user_id = req.user?._id

        if (!first_name && !last_name && !entity_name) {
            return res.status(200).json({
                error: true,
                message: "Please enter the name.",
            });
        }

        if (email) {
            if (!isValidEmail(email)) {
                return res.status(200).json({
                    error: true,
                    message: "Please enter valid email.",
                });
            }
            const existingEmail = await Clients.findOne({ email, user_id });
            if (existingEmail) {
                return res.status(200).json({
                    error: true,
                    message: "Client already created with this email.",
                });
            }
        }

        if (phone) {
            if (phone?.length < 10 || phone.length > 13) {
                return res.status(200).json({
                    error: true,
                    message: "Please enter valid phone number.",
                });
            }
        }

        if (abn_number) {
            const existingAbnNumber = await Clients.findOne({ abn_number, user_id });
            if (existingAbnNumber) {
                return res.status(200).json({
                    error: true,
                    message: "ABN number should be unique.",
                });
            }
        }

        if (client_code) {
            const existingClientCode = await Clients.findOne({ client_code, user_id });
            if (existingClientCode) {
                return res.status(200).json({
                    error: true,
                    message: "Client code should be unique.",
                });
            }
        } else {
            return res.status(200).json({
                error: true,
                message: "Client code is required.",
            });
        }

        const clientData = {
            user_id,
            abn_number,
            preferred_name,
            phone, email,
            client_code,
            user_defined,
            address,
            sheet_name: "Spreadsheet"
        }

        if (entity_name) {
            clientData.entity_name = entity_name
        } else {
            clientData.first_name = first_name
            clientData.last_name = last_name
        }

        const newClient = await new Clients(clientData).save()

        const user = await Users.findById(user_id);
        if (user) {
            await createUserClientCategoryCollection(user, newClient?._id)
            await createBlankSpreadsheet(user?.email, newClient?._id)
        }

        res.status(201).send({
            error: false,
            message: "Client created successfully.",
            client: newClient
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const updateClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { first_name, last_name, entity_name, abn_number, preferred_name, phone, email, user_defined, address, client_code } = req.body
        const user_id = req.user?._id
        const { id } = req.params

        const existingClient = await Clients.findById({ _id: id })
        if (!existingClient) {
            return res.status(400).json({
                error: true,
                message: "Client is not existing."
            })
        }

        if (!first_name && !last_name && !entity_name) {
            return res.status(200).json({
                error: true,
                message: "Please enter the name.",
            });
        }

        if (email) {
            if (!isValidEmail(email)) {
                return res.status(200).json({
                    error: true,
                    message: "Please enter valid email.",
                });
            }
            const existingEmail = await Clients.findOne({ email, user_id, _id: { $ne: id } });
            if (existingEmail) {
                return res.status(200).json({
                    error: true,
                    message: "Client already created with this email.",
                });
            }
        }

        if (phone) {
            if (phone?.length < 10 || phone.length > 13) {
                return res.status(200).json({
                    error: true,
                    message: "Please enter valid phone number.",
                });
            }
        }

        if (abn_number) {
            const existingAbnNumber = await Clients.findOne({ abn_number, user_id, _id: { $ne: id } });
            if (existingAbnNumber) {
                return res.status(200).json({
                    error: true,
                    message: "ABN number should be unique.",
                });
            }
        }

        if (client_code) {
            const existingClientCode = await Clients.findOne({ client_code, user_id, _id: { $ne: id } });
            if (existingClientCode) {
                return res.status(200).json({
                    error: true,
                    message: "Client code should be unique.",
                });
            }
        } else {
            return res.status(200).json({
                error: true,
                message: "Client code is required.",
            });
        }

        const clientData = {
            user_id,
            abn_number,
            preferred_name,
            phone, email,
            user_defined,
            address,
            client_code
        }

        if (entity_name) {
            clientData.entity_name = entity_name
            clientData.first_name = ""
            clientData.last_name = ""
        } else {
            clientData.first_name = first_name
            clientData.last_name = last_name
            clientData.entity_name = ""
        }

        const updatedClient = await Clients.findByIdAndUpdate(id, clientData, { new: true, });
        res.status(201).send({
            error: false,
            message: "Client updated successfully.",
            updatedClient
        })
    } catch (error) {
        res.status(500).send('Server error');
    }
}

const getAllClients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortField = req.query.sortField || "createdAt";
        const sortOrder = parseInt(req.query.sortOrder) || -1;
        const filter = req.query.filter;
        let query = {};

        if (filter && filter !== "null") {
            query = {
                $or: [
                    { first_name: { $regex: filter, $options: "i" } },
                    { last_name: { $regex: filter, $options: "i" } },
                    { entity_name: { $regex: filter, $options: "i" } },
                    { email: { $regex: filter, $options: "i" } },
                    { client_code: { $regex: filter, $options: "i" } },
                ],
            };
        }

        const totalClients = await Clients.countDocuments({ ...query, user_id: req.user?._id });
        const skip = (page - 1) * limit;

        const clients = await Clients.find({ ...query, user_id: req.user?._id })
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            error: false,
            message: "Clients fetched successfully.",
            clients,
            currentPage: page,
            totalPages: Math.ceil(totalClients / limit),
            totalClients,
        });
    } catch (error) {
        console.error("Error in getAllClients:", error);
        return res.status(500).send('Server error');
    }
}

const exportClient = async (req, res) => {
    try {
        let clients = await Clients.find({ user_id: req.user?._id }).select('-_id -updatedAt -createdAt -__v -user_id');

        clients = clients.map(client => {
            if (client?.entity_name) {
                return {
                    ...client.toObject(),
                    individual: "No"
                }
            } else {
                return {
                    ...client.toObject(),
                    individual: "Yes"
                }
            }
        });

        return res.status(200).json({
            error: false,
            message: "Clients fetched successfully.",
            clients
        });
    } catch (error) {
        console.error("Error in clientsWithoutPaging:", error);
        return res.status(500).send('Server error');
    }
}

const getSingleClient = async (req, res) => {
    try {
        const { id } = req.params

        const client = await getClient(id)
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client is not existing."
            })
        }

        return res.status(200).json({
            error: false,
            message: "Client is fetched successfully.",
            client
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const getSharedClient = async (req, res) => {
    try {
        const { token } = req.params

        const client = await Clients.findOne({ token, is_shared: true });

        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client is not existing."
            })
        }

        return res.status(200).json({
            error: false,
            message: "Client is fetched successfully.",
            client
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const getClient = async (id) => {
    try {
        return await Clients.findById({ _id: id })
    } catch (error) {
        console.log(error.message)
    }
}

const getClientCategory = async (req, res) => {
    try {
        const { id } = req.params

        const client = await getClient(id)
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client is not existing."
            })
        }

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userCategory = database.collection(`${user?.email.split("@")[0]}_client_category`);
        const clientCategory = await userCategory.findOne({ client_id: new ObjectId(id) });

        if (!clientCategory) {
            return res.status(404).json({
                error: true,
                message: "Client category not found."
            });
        }

        return res.status(200).json({
            error: false,
            message: "Client category is fetched successfully.",
            clientCategory
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const getClientSpreadsheets = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortField = req.query.sortField || "createdAt";
        const sortOrder = parseInt(req.query.sortOrder) || -1;

        const client = await getClient(id);
        if (!client) {
            return res.status(404).json({
                error: true,
                message: "Client does not exist.",
            });
        }

        const user = await Users.findById(client?.user_id);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: "User associated with the client does not exist.",
            });
        }

        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userSheetsCollection = database.collection(`${user?.email.split("@")[0]}_spreadsheets`);

        const totalDocuments = await userSheetsCollection.countDocuments({ client_id: new ObjectId(id) });

        const totalPages = Math.ceil(totalDocuments / limit);
        const skip = (page - 1) * limit;

        const clientSpreadsheets = await userSheetsCollection
            .find({ client_id: new ObjectId(id) })
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit)
            .toArray();

        return res.status(200).json({
            error: false,
            message: "Client spreadsheets fetched successfully.",
            clientSpreadsheets,
            currentPage: page,
            totalPages,
            totalSpreadsheets: totalDocuments
        });
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
};

const getSpreadsheetData = async (req, res) => {
    try {
        const { clientId, sheetId } = req.query;

        const client = await getClient(clientId);
        if (!client) {
            return res.status(404).json({
                error: true,
                message: "Client does not exist.",
            });
        }

        const user = await Users.findById(client?.user_id);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: "User associated with the client does not exist.",
            });
        }

        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userSreadsheetCollection = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);
        const spreadsheet = await userSreadsheetCollection.find({ spreadsheet: new ObjectId(sheetId) }).toArray();

        const userSheetsCollection = database.collection(`${user?.email.split("@")[0]}_spreadsheets`);
        const sheet = await userSheetsCollection.findOne({ _id: new ObjectId(sheetId) });

        const formattedData = spreadsheet.map((item) => item.data);

        const headers = ["Bank Account", "Date", "Amt", "Narrative", "Categories", 'Business%', 'TaxableAmt', 'GST_Code', 'GST_Amt', 'Excl.GST_Amt', 'FY', 'QTR', 'ITR_Label', 'BAS_LabN']

        return res.status(200).json({
            error: false,
            message: "Spreadsheet fetched successfully.",
            spreadsheet: [headers, ...formattedData],
            name: sheet?.name
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const deleteSpreadSheetData = async (req, res) => {
    try {
        const { clientId, sheetId } = req.body;

        const client = await getClient(clientId);
        if (!client) {
            return res.status(404).json({
                error: true,
                message: "Client does not exist.",
            });
        }

        const user = await Users.findById(client?.user_id);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: "User associated with the client does not exist.",
            });
        }

        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userSheetsCollection = database.collection(`${user?.email.split("@")[0]}_spreadsheets`);
        await userSheetsCollection.deleteOne({ _id: new ObjectId(sheetId) });
        await deleteSpreadsheetFromCLient(user, sheetId)

        return res.status(200).json({
            error: false,
            message: "Spreadsheet deleted successfully.",
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const deleteSpreadsheetFromCLient = async (user, id) => {
    try {
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userCategory = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);
        await userCategory.deleteMany({ spreadsheet: new ObjectId(id) });
    } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
    }
}

const updateClientCategory = async (req, res) => {
    try {
        const { id } = req.params
        let { data, deletedCategory = [], updatedCategory = [] } = req.body

        const client = await getClient(id)
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client is not existing."
            })
        }

        if (!Array.isArray(data)) {
            return res.status(200).json({
                error: true,
                message: "Data must be array and not empty.",
            })
        }

        data = data.filter(
            subArray => subArray.some(item => item.trim() !== "")
        );

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userCategory = database.collection(`${user?.email.split("@")[0]}_client_category`);

        const clientCatgory = await userCategory.findOneAndUpdate(
            { client_id: new ObjectId(id) },
            { $set: { data } },
            { returnOriginal: false }
        );

        const clientSpreadsheet = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);

        if (deletedCategory.length > 0) {
            for (const category of deletedCategory) {
                const spreadsheetCursor = await clientSpreadsheet
                    .find({ client_id: new ObjectId(id), category: category })
                    .toArray();

                for (const spreadsheet of spreadsheetCursor) {
                    const data = [...spreadsheet.data];

                    const indicesToBlank = [4, 7, 8, 9, 12, 13];
                    indicesToBlank.forEach(index => {
                        if (index < data.length) {
                            data[index] = "";
                        }
                    });
                    await clientSpreadsheet.updateOne(
                        { _id: spreadsheet._id },
                        {
                            $set: {
                                data,
                                category: data[4],
                                updatedAt: new Date(),
                            }
                        }
                    );
                }
            }
        }

        if (updatedCategory.length > 0) {
            for (const category of updatedCategory) {
                const spreadsheetCursor = await clientSpreadsheet
                    .find({ client_id: new ObjectId(id), category: category[0] })
                    .toArray();

                for (const spreadsheet of spreadsheetCursor) {
                    const data = [...spreadsheet.data];

                    data[4] = category[1]
                    await clientSpreadsheet.updateOne(
                        { _id: spreadsheet._id },
                        {
                            $set: {
                                data,
                                category: data[4],
                                updatedAt: new Date(),
                            }
                        }
                    );
                }
            }
        }


        return res.status(200).json({
            error: false,
            message: "Client category is updated successfully.",
            clientCatgory
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    } finally {
        await mongoClient.close();
    }
}

const deleteClientCategory = async (user, id) => {
    try {
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userCategory = database.collection(`${user?.email.split("@")[0]}_client_category`);
        await userCategory.deleteOne({ client_id: new ObjectId(id) });
    } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
    }
}

const deleteSpreadsheet = async (user, id) => {
    try {
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userCategory = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);
        await userCategory.deleteMany({ client_id: new ObjectId(id) });
        const userSheetsCollection = database.collection(`${user?.email.split("@")[0]}_spreadsheets`);
        await userSheetsCollection.deleteOne({ client_id: new ObjectId(id) });
    } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
    }
}

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params
        const data = await singleClientDelete(id)
        return res.json(data)
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const validateAndUpdateClient = async (clientData, id, user_id, isInsert) => {
    const {
        first_name,
        last_name,
        entity_name,
        abn_number,
        preferred_name,
        phone,
        email,
        user_defined,
        address,
        individual
    } = clientData;

    const errors = [];

    try {
        if (individual == "no" || individual == "No") {
            if (!entity_name || entity_name.length < 2) {
                const errorObj = {
                    field: "entity_name",
                    message: "Entity name is required and must be at least two characters long."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        } else {
            if (!first_name || first_name.length < 2) {
                const errorObj = {
                    field: "first_name",
                    message: "First name is required and must be at least two characters long."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }

            if (!last_name || last_name.length < 2) {
                const errorObj = {
                    field: "last_name",
                    message: "Last name is required and must be at least two characters long."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        }

        if (email) {
            if (!isValidEmail(email)) {
                const errorObj = {
                    field: "email",
                    message: "Please enter a valid email."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
            const existingEmail = await Clients.findOne({ email, user_id, _id: { $ne: id } });
            if (existingEmail) {
                const errorObj = {
                    field: "email",
                    message: "Client already created with this email."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        }

        if (phone) {
            if (phone.length < 10 || phone.length > 13) {
                const errorObj = {
                    field: "phone",
                    message: "Please enter a valid phone number."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        }

        if (abn_number) {
            const existingAbnNumber = await Clients.findOne({ abn_number, user_id, _id: { $ne: id } });
            if (existingAbnNumber) {
                const errorObj = {
                    field: "abn_number",
                    message: "This ABN number is already registered."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        }

        if (!isInsert && errors.length > 0) {
            return {
                status: 200,
                error: true,
                errors
            };
        }

        if (isInsert) {
            const updateData = {
                user_id,
                abn_number,
                preferred_name,
                phone,
                email,
                user_defined,
                address
            };

            if (entity_name) {
                updateData.entity_name = entity_name;
                updateData.first_name = "";
                updateData.last_name = "";
            } else {
                updateData.first_name = first_name;
                updateData.last_name = last_name;
                updateData.entity_name = "";
            }

            await Clients.findByIdAndUpdate(id, updateData, { new: true });
        }

        return {
            status: 201,
            error: false,
            message: "Client updated successfully."
        };
    } catch (error) {
        return {
            status: 500,
            error: true,
            message: 'Server error'
        };
    }
};


const validateAndCreateClient = async (clientData, user_id, isInsert) => {
    const {
        first_name,
        last_name,
        entity_name,
        abn_number,
        preferred_name,
        phone,
        email,
        client_code,
        user_defined,
        address,
        individual
    } = clientData;

    const errors = [];

    try {
        if (individual == "no" || individual == "No") {
            if (!entity_name || entity_name.length < 2) {
                const errorObj = {
                    field: "entity_name",
                    message: "Entity name is required and must be at least two characters long."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        } else {
            if (!first_name || first_name.length < 2) {
                const errorObj = {
                    field: "first_name",
                    message: "First name is required and must be at least two characters long."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }

            if (!last_name || last_name.length < 2) {
                const errorObj = {
                    field: "last_name",
                    message: "Last name is required and must be at least two characters long."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        }

        if (email) {
            if (!isValidEmail(email)) {
                const errorObj = {
                    field: "email",
                    message: "Please enter a valid email."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
            const existingEmail = await Clients.findOne({ email, user_id });
            if (existingEmail) {
                const errorObj = {
                    field: "email",
                    message: "Client already created with this email."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        }

        if (phone) {
            if (phone.length < 10 || phone.length > 13) {
                const errorObj = {
                    field: "phone",
                    message: "Please enter a valid phone number."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        }

        if (abn_number) {
            const existingAbnNumber = await Clients.findOne({ abn_number, user_id });
            if (existingAbnNumber) {
                const errorObj = {
                    field: "abn_number",
                    message: "This ABN number is already registered."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        }

        if (client_code) {
            const trimmedClientCode = client_code.trim();
            const existingClientCode = await Clients.findOne({ client_code: trimmedClientCode, user_id });
            if (existingClientCode) {
                const errorObj = {
                    field: "client_code",
                    message: "Client code should be unique."
                };
                if (isInsert) return { status: 200, error: true, ...errorObj };
                errors.push(errorObj);
            }
        }

        if (!isInsert && errors.length > 0) {
            return {
                status: 200,
                error: true,
                errors
            };
        }

        if (isInsert) {
            const lastClient = await generateClientCode(user_id);
            const newClientCode = `${(entity_name ? entity_name.slice(0, 2) : last_name.slice(0, 2)).toUpperCase()}${lastClient.clientCode.toUpperCase()}`;

            const newClientData = {
                user_id,
                abn_number,
                preferred_name,
                phone,
                email,
                client_code: newClientCode,
                user_defined,
                address,
                first_name,
                last_name,
                entity_name
            };

            const newClient = await new Clients(newClientData).save();

            const user = await Users.findById(user_id);
            if (user) {
                await createUserClientCategoryCollection(user, newClient?._id);
                await createBlankSpreadsheet(user?.email, newClient?._id);
            }
        }

        return {
            error: false,
            message: "Client created successfully."
        };
    } catch (error) {
        console.error(error.message);
        return {
            error: true,
            message: 'Server error'
        };
    }
};

const clientImport = async (req, res) => {
    try {
        let successImports = 0;
        let failedImports = 0;
        let { clients, isInsert } = req.body;
        const user_id = req.user._id;
        clients = JSON.parse(clients);
        const failedClients = [];

        for (const client of clients) {
            const { client_code } = client;

            const [existingClient] = await Clients.find({ client_code, user_id });

            if (existingClient) {
                const updatedClient = await validateAndUpdateClient(client, existingClient?._id, user_id, isInsert);
                if (updatedClient.error) {
                    failedImports += 1;
                } else {
                    successImports += 1;
                }
                failedClients.push({
                    ...client,
                    errors: updatedClient?.errors || []
                });
            } else {
                const newClient = await validateAndCreateClient(client, user_id, isInsert);
                if (newClient.error) {
                    failedImports += 1;
                } else {
                    successImports += 1;
                }
                failedClients.push({
                    ...client,
                    errors: newClient?.errors || []
                });
            }
        }

        const emailMap = new Map();
        const abnMap = new Map();

        for (let index = 0; index < failedClients.length; index++) {
            const client = failedClients[index];
            const { email, abn_number, client_code } = client;

            if (email) {
                const existingEmail = await Clients.findOne({ email, user_id, client_code });

                if (!existingEmail) {
                    if (!emailMap.has(email)) {
                        emailMap.set(email, []);
                    } else {
                        failedImports += 1;
                    }
                    emailMap.get(email).push(index);
                }
            }

            if (abn_number) {
                const existingAbn = await Clients.findOne({ abn_number, user_id, client_code });

                if (!existingAbn) {
                    if (!abnMap.has(abn_number)) {
                        abnMap.set(abn_number, []);
                    } else {
                        failedImports += 1;
                    }
                    abnMap.get(abn_number).push(index);
                }
            }
        }

        emailMap.forEach((indexes, email) => {
            if (indexes.length > 1) {
                indexes.forEach((index) => {
                    failedClients[index].errors.push({
                        field: "email",
                        message: "Email should be unique."
                    });
                });
            }
        });

        abnMap.forEach((indexes, abn_number) => {
            if (indexes.length > 1) {
                indexes.forEach((index) => {
                    failedClients[index].errors.push({
                        field: "abn_number",
                        message: "ABN number should be unique."
                    });
                });
            }
        });

        if (isInsert) {
            return res.status(200).json({
                error: false,
                message: `${successImports} clients imported successfully${failedImports > 0 ? `, ${failedImports} skipped with error.` : "."}`,
                failedClients
            });
        } else {
            if (failedImports > 0) {
                return res.status(200).json({
                    error: true,
                    message: `You have error in your file, please improve the data and upload again.`,
                    failedClients
                });
            } else {
                return res.status(200).json({
                    error: false,
                    message: `Your file is validated and ready to import, please verify data and press upload.`,
                    failedClients
                });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

const singleClientDelete = async (id) => {
    try {
        const existingClient = await Clients.findById(id)
        if (!existingClient) {
            return {
                error: true,
                message: "CLient is not existing."
            }
        }

        const user = await Users.findById(existingClient?.user_id);
        if (user) {
            await deleteClientCategory(user, id)
            await deleteSpreadsheet(user, id)
        }

        await Clients.deleteOne({ _id: id, user_id: existingClient?.user_id });
        return {
            error: false,
            message: "Client deleted successfully.",
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const bulkClientDelete = async (req, res) => {
    try {
        let { selectedClientIds } = req.body
        selectedClientIds = JSON.parse(selectedClientIds)

        for (const clientId of selectedClientIds) {
            await singleClientDelete(clientId)
        }

        return res.status(200).json({
            error: false,
            message: 'Clients deleted successfully.',
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const getSpreadsheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { fromDate, toDate } = req.query;

        const client = await getClient(id);
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client is not existing."
            });
        }

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userSpreadsheet = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);

        const startDate = fromDate ? moment(fromDate, 'YYYY-MM-DD') : moment().startOf('year');
        const endDate = toDate ? moment(toDate, 'YYYY-MM-DD') : moment().endOf('year');
        const spreadsheetCursor = await userSpreadsheet.find({ client_id: new ObjectId(id) }).toArray();

        const filteredData = spreadsheetCursor.filter((record) => {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

            if (dateInRecord.isValid()) {
                return dateInRecord.isBetween(startDate, endDate, null, '[]');
            }
        });

        const data = filteredData.map((row) => {
            const rowData = [...row.data];

            while (rowData.length < spreadsheetCursor[0].data.length - 1) {
                rowData.push("");
            }

            return [row._id, ...rowData, row.inter_bank];
        });

        if (!spreadsheetCursor) {
            return res.status(404).json({
                error: true,
                message: "Spreadsheet not found."
            });
        }

        return res.status(200).json({
            error: false,
            message: "Spreadsheet is fetched successfully.",
            spreadsheet: [spreadsheetCursor[0].data, ...data],
            sheet_name: client?.sheet_name,
            link: client?.token ? `${process.env.CLIENT_SIDE_URL}/collabrative-sheet/${client?.token}` : '',
            isShared: client?.is_shared ? client?.is_shared : false
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

function runPythonScript(operation, userId, filePath) {
    return new Promise((resolve, reject) => {
        const parentDirectory = path.join(__dirname, '../ac-text-classifier/');
        const pythonScriptPath = path.join(parentDirectory, "main.py");

        const args = [pythonScriptPath, operation, userId, filePath];

        const pythonProcess = spawn(`${process.env.PYTHON_PATH}`, args);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on("data", (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            errorData += data.toString();
        });

        pythonProcess.on("error", (error) => {
            reject(`Error starting Python script: ${error.message}`);
        });

        pythonProcess.on("close", (code) => {
            if (code !== 0) {
                reject(`Python script exited with code ${code}: ${errorData}`);
            } else {
                resolve(outputData);
            }
        });
    });
}
const readCsv = async (filePath) => {
    const csvFile = fs.createReadStream(filePath);
    const results = [];

    return new Promise((resolve, reject) => {
        csvFile
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
    });
}

const train = async (oldData, id) => {
    const parentDirectory = path.join(__dirname, '..');
    const folderPath = path.join(parentDirectory, 'spreadsheet');

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const formattedDate = moment().format('DD-MM-YYYY-HH-mm');
    const filePath = path.join(folderPath, `${id}-${formattedDate}-train.csv`);
    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: oldData[0].map((header, index) => ({ id: index.toString(), title: header })),
    });

    await csvWriter.writeRecords(oldData.slice(1));
    await runPythonScript("train", id, filePath);

    // Delete the CSV file after the Python script has run
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};


const classify = async (newData, id, database, email, additionalHeaders = []) => {
    const parentDirectory = path.join(__dirname, '..');
    const folderPath = path.join(parentDirectory, 'spreadsheet');

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const formattedDate = moment().format('DD-MM-YYYY-HH-mm');
    const filePath = path.join(folderPath, `${id}-${formattedDate}-classify.csv`);
    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: newData[0].map((header, index) => ({ id: index.toString(), title: header })),
    });

    await csvWriter.writeRecords(newData.slice(1));
    await runPythonScript("classify", id, filePath);
    const data = await readCsv(filePath);

    const userCategory = database.collection(`${email.split("@")[0]}_client_category`);
    const clientCategory = await userCategory.findOne({ client_id: new ObjectId(id) });


    const fromattedData = data.map(row => {
        let gst_code = ''
        let itr_label = ''
        let gst_amt = 0;
        let exc_gst = 0;
        let bs_labn = ''

        if (row?.category) {
            const [category] = clientCategory.data.filter(c => c[0] == row.category);
            gst_code = category[2]
            itr_label = category[3]
            if (gst_code) {
                gst_amt = (row.taxableAmt / 11).toFixed(2);
                exc_gst = (row.taxableAmt - gst_amt).toFixed(2);
                bs_labn = gst_amt > 0 ? "1A" : "1B"
            }
        }

        return [
            row.account,
            row.date,
            row.amount,
            row.narrative,
            row.category,
            row.business,
            row.taxableAmt,
            gst_code,
            gst_amt,
            exc_gst,
            row.fy,
            row.qtr,
            itr_label,
            bs_labn,
            ...additionalHeaders.map(header => row[header]),
            row.id
        ];
    });

    // Delete the CSV file after the Python script has run
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    // const modelDirectory = path.join(__dirname, '../ac-text-classifier/models/');
    // const modelPath = path.join(modelDirectory, `${id}`);
    // if (fs.existsSync(modelPath)) {
    //     try {
    //         fs.rmSync(modelPath, { recursive: true, force: true });
    //         console.log(`${modelPath} is deleted successfully.`);
    //     } catch (err) {
    //         console.error(`Error while deleting ${modelPath}`, err);
    //     }
    // }
    return fromattedData
}

function removeMatchedItems(newCsv, spreadsheetCursor) {

    const oldCsv = spreadsheetCursor.filter((record) => {
        if (record.data[1]) {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

            return dateInRecord.isValid();
        }
    });

    const formattedData = oldCsv.map((row) => {
        const formattedDate = moment(row.data[1], 'YYYY-MM-DD').format('YYYY-MM-DD');
        return [row.data[0], formattedDate, ...row.data.slice(2)];
    });

    const result = [];

    for (let i = 0; i < newCsv.length; i++) {
        let isMatched = false;

        for (let j = 0; j < formattedData.length; j++) {
            if (
                newCsv[i][1] === formattedData[j][1] &&
                parseFloat(newCsv[i][2]) === parseFloat(formattedData[j][2]) &&
                newCsv[i][3] === formattedData[j][3]
            ) {
                isMatched = true;
                break;
            }
        }

        if (!isMatched) {
            result.push(newCsv[i]);
        }
    }
    return result;
}

const transformObjectId = (item) => {
    return item instanceof ObjectId ? item.toString() : item;
};


const checkInterBank = async (spreadsheetCursor, classifiedData, client_id, spreadsheet, userSpreadsheet, insertedDataId = [], interBankIds = []) => {
    const startDate = moment(classifiedData[0][1] ?? 'now').subtract(2, 'days');
    const endDate = moment();

    const filteredData = spreadsheetCursor.filter((record) => {
        if (record.data[4] && record.inter_bank === false) {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

            if (dateInRecord.isValid()) {
                return dateInRecord.isBetween(startDate, endDate, null, '[]');
            }
        }
    });

    const formattedData = filteredData.map((row) => {
        const dateInString = row.data[1];
        const formattedDate = moment(dateInString, 'YYYY-MM-DD').format('YYYY-MM-DD');

        if (row?.data[0] && row?.data[1] && row?.data[2] && row.data[4] && moment(dateInString, 'YYYY-MM-DD').isValid()) {
            return [row.data[0], formattedDate, ...row.data.slice(2), row._id];
        }
        return null;
    }).filter(row => row !== null);


    const newData = classifiedData.map((data) => {
        if (data[0] && data[1] && data[2] && data[4]) {
            return data;
        }
        return null;
    }).filter(row => row !== null);

    const interBankData = [];
    for (const newRow of newData) {
        const newRowAmount = parseFloat(newRow[2]);

        for (const formattedRow of formattedData) {
            if (formattedRow[0] !== newRow[0] && parseFloat(formattedRow[2]) + newRowAmount === 0) {
                interBankData.push(newRow);

                const insertedId = await userSpreadsheet.insertOne({
                    data: newRow,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    client_id: new ObjectId(client_id),
                    spreadsheet,
                    inter_bank: true,
                    inter_bank_with: new ObjectId(formattedRow[formattedRow.length - 1]),
                    category: newRow[4]
                });
                insertedDataId.push(insertedId?.insertedId)

                await userSpreadsheet.updateOne(
                    { _id: formattedRow[formattedRow.length - 1] },
                    {
                        $set: {
                            inter_bank: true,
                            inter_bank_with: new ObjectId(insertedId?.insertedId)
                        }
                    }
                );
                interBankIds.push([transformObjectId(insertedId?.insertedId), transformObjectId(formattedRow[formattedRow.length - 1]), true])
                break;
            }
        }
    }

    const newCsv = classifiedData.filter(data => {
        return !interBankData.some(interBank =>
            data[0] === interBank[0] &&
            data[1] === interBank[1] &&
            data[2] === interBank[2] &&
            data[4] === interBank[4]
        );
    });

    return newCsv
}

const interBankForUpdate = async (spreadsheetCursor, classifiedData, itemId, clientSpreadsheet, interBankIds) => {
    const startDate = moment(classifiedData[0][1] ?? 'now').subtract(2, 'days');
    const endDate = moment();

    const filteredData = spreadsheetCursor.filter((record) => {
        if (record.data[4]) {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

            if (dateInRecord.isValid()) {
                return dateInRecord.isBetween(startDate, endDate, null, '[]');
            }
        }
    });

    const formattedData = filteredData.map((row) => {
        const dateInString = row.data[1];
        const formattedDate = moment(dateInString, 'YYYY-MM-DD').format('YYYY-MM-DD');

        if (row?.data[0] && row?.data[1] && row?.data[2] && row.data[4] && moment(dateInString, 'YYYY-MM-DD').isValid()) {
            return [row.data[0], formattedDate, ...row.data.slice(2), row._id];
        }
        return null;
    }).filter(row => row !== null);

    const newData = classifiedData.map((data) => {
        if (data[0] && data[1] && data[2] && data[4]) {
            return data;
        }
        return null;
    }).filter(row => row !== null);

    const interBankData = [];

    for (const newRow of newData) {
        const newRowAmount = parseFloat(newRow[2]);

        for (const formattedRow of formattedData) {
            if (formattedRow[0] !== newRow[0] && parseFloat(formattedRow[2]) + newRowAmount === 0) {
                interBankData.push(newRow);

                await clientSpreadsheet.updateOne(
                    { _id: new ObjectId(itemId) },
                    {
                        $set: {
                            inter_bank: true,
                            data: newRow,
                            category: newRow[4],
                            updatedAt: new Date(),
                            inter_bank_with: new ObjectId(formattedRow[formattedRow.length - 1]),
                        }
                    }
                );

                await clientSpreadsheet.updateOne(
                    { _id: formattedRow[formattedRow.length - 1] },
                    {
                        $set: {
                            inter_bank: true,
                            inter_bank_with: new ObjectId(itemId)
                        }
                    }
                );
                interBankIds.push([transformObjectId(itemId), transformObjectId(formattedRow[formattedRow.length - 1]), true])
                break;
            }
        }
    }

    const newCsv = classifiedData.filter(data => {
        return !interBankData.some(interBank =>
            data[0] === interBank[0] &&
            data[1] === interBank[1] &&
            data[2] === interBank[2] &&
            data[4] === interBank[4]
        );
    });

    return newCsv;
};

const createClientSpreadsheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, fileName } = req.body;

        const client = await getClient(id);
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client does not exist.",
            });
        }

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                error: true,
                message: "Data must be an array and not empty.",
            });
        }

        const newCsv = [["Bank Account", "Date", "Amt", "Narrative", "Categories", 'Business%', 'TaxableAmt', 'GST_Code', 'GST_Amt', 'Excl.GST_Amt', 'FY', 'QTR', 'ITR_Label', 'BAS_LabN']]

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);

        const blankFilteredData = data.filter(subArray =>
            subArray.some(element => element.trim() !== '')
        );

        if (blankFilteredData[0][0] === "Bank Account") {
            blankFilteredData.shift();
            blankFilteredData.forEach(row => {
                const [bankAccount, date, narrative, debitAmt, creditAmt, otherCat, serial] = row;
                let amount = '';
                if (creditAmt) {
                    amount = parseFloat(creditAmt.replace(/,/g, ''));
                } else if (debitAmt) {
                    amount = -parseFloat(debitAmt.replace(/,/g, ''));
                }

                const businessRate = 100
                const taxable_amt = ((amount * businessRate) / 100).toFixed(2);

                if (date) {
                    const formattedDate = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
                    const financialYear = moment(formattedDate).year();
                    const month = moment(formattedDate).month() + 1;

                    let quarter;
                    let quarterRange;

                    if (month >= 1 && month <= 3) {
                        quarter = 1;
                        quarterRange = 'Jan-Mar';
                    } else if (month >= 4 && month <= 6) {
                        quarter = 2;
                        quarterRange = 'Apr-Jun';
                    } else if (month >= 7 && month <= 9) {
                        quarter = 3;
                        quarterRange = 'Jul-Sep';
                    } else {
                        quarter = 4;
                        quarterRange = 'Oct-Dec';
                    }

                    newCsv.push([bankAccount, formattedDate, amount, narrative, '', businessRate, taxable_amt, '', '', '', financialYear, quarterRange, '', '']);
                }
            })
        } else {
            if (blankFilteredData[0].length === 3) {
                blankFilteredData.forEach(row => {
                    const [date, amount, narrative] = row;
                    const businessRate = 100;
                    const taxable_amt = ((amount * businessRate) / 100).toFixed(2);

                    if (date) {
                        const formattedDate = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
                        const financialYear = moment(formattedDate).year();
                        const month = moment(formattedDate).month() + 1;

                        let quarter;
                        let quarterRange;

                        if (month >= 1 && month <= 3) {
                            quarter = 1;
                            quarterRange = 'Jan-Mar';
                        } else if (month >= 4 && month <= 6) {
                            quarter = 2;
                            quarterRange = 'Apr-Jun';
                        } else if (month >= 7 && month <= 9) {
                            quarter = 3;
                            quarterRange = 'Jul-Sep';
                        } else {
                            quarter = 4;
                            quarterRange = 'Oct-Dec';
                        }
                        newCsv.push(["", formattedDate, amount, narrative, '', businessRate, taxable_amt, '', '', '', financialYear, quarterRange, '', '']);
                    }
                });
            } else if (blankFilteredData[0].length === 4) {
                if (blankFilteredData[0][0] === "Account History for Account:") {
                    const accountNumber = blankFilteredData[0][1].split("-")[1].trim();
                    blankFilteredData.splice(0, 2);

                    blankFilteredData.forEach(row => {
                        const [date, narrative, amount] = row;
                        const cleanAmount = parseFloat(amount.replace(/[$,]/g, ''));
                        const businessRate = 100
                        const taxable_amt = ((amount * businessRate) / 100).toFixed(2);

                        if (date) {
                            const formattedDate = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
                            const financialYear = moment(formattedDate).year();
                            const month = moment(formattedDate).month() + 1;

                            let quarter;
                            let quarterRange;

                            if (month >= 1 && month <= 3) {
                                quarter = 1;
                                quarterRange = 'Jan-Mar';
                            } else if (month >= 4 && month <= 6) {
                                quarter = 2;
                                quarterRange = 'Apr-Jun';
                            } else if (month >= 7 && month <= 9) {
                                quarter = 3;
                                quarterRange = 'Jul-Sep';
                            } else {
                                quarter = 4;
                                quarterRange = 'Oct-Dec';
                            }

                            newCsv.push([accountNumber, formattedDate, cleanAmount, narrative, '', businessRate, taxable_amt, '', '', '', financialYear, quarterRange, '', '']);
                        }
                    });
                } else {
                    blankFilteredData.forEach(row => {
                        const [date, amount, narrative] = row;

                        const businessRate = 100
                        const taxable_amt = ((amount * businessRate) / 100).toFixed(2);

                        if (date) {
                            const formattedDate = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
                            const financialYear = moment(formattedDate).year();
                            const month = moment(formattedDate).month() + 1;

                            let quarter;
                            let quarterRange;

                            if (month >= 1 && month <= 3) {
                                quarter = 1;
                                quarterRange = 'Jan-Mar';
                            } else if (month >= 4 && month <= 6) {
                                quarter = 2;
                                quarterRange = 'Apr-Jun';
                            } else if (month >= 7 && month <= 9) {
                                quarter = 3;
                                quarterRange = 'Jul-Sep';
                            } else {
                                quarter = 4;
                                quarterRange = 'Oct-Dec';
                            }

                            newCsv.push(["", formattedDate, amount, narrative, '', businessRate, taxable_amt, '', '', '', financialYear, quarterRange, '', '']);
                        }
                    });
                }
            } else if (blankFilteredData[0].length === 7) {
                blankFilteredData.forEach(row => {
                    const [date, amount, str1, str2, narrative1, narrative2] = row;
                    const businessRate = 100
                    const taxable_amt = ((amount * businessRate) / 100).toFixed(2);

                    if (date) {
                        const formattedDate = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
                        const financialYear = moment(formattedDate).year();
                        const month = moment(formattedDate).month() + 1;

                        let quarter;
                        let quarterRange;

                        if (month >= 1 && month <= 3) {
                            quarter = 1;
                            quarterRange = 'Jan-Mar';
                        } else if (month >= 4 && month <= 6) {
                            quarter = 2;
                            quarterRange = 'Apr-Jun';
                        } else if (month >= 7 && month <= 9) {
                            quarter = 3;
                            quarterRange = 'Jul-Sep';
                        } else {
                            quarter = 4;
                            quarterRange = 'Oct-Dec';
                        }

                        const narrative = `${narrative1} ${narrative2}`

                        newCsv.push(["", formattedDate, amount, narrative, '', businessRate, taxable_amt, '', '', '', financialYear, quarterRange, '', '']);
                    }
                });
            } else {
                return res.status(200).json({
                    error: true,
                    message: "Your CSV file has an incorrect format.",
                });
            }
        }

        const collections = await database.listCollections().toArray();
        const collectionExists = collections.some(col => col.name === `${user?.email.split("@")[0]}_client_spreadsheet`);

        if (!collectionExists) {
            await database.createCollection(`${user?.email.split("@")[0]}_client_spreadsheet`);
        }

        const userSpreadsheet = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);

        const spreadsheetCursor = await userSpreadsheet.find({ client_id: new ObjectId(id) }).toArray();

        const filteredData = spreadsheetCursor.filter((record) => {
            if (record.data[3] && record.data[4]) {
                const dateInString = record.data[1];
                const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

                return dateInRecord.isValid();
            }
        });

        const formattedData = filteredData.map((row) => {
            const formattedDate = moment(row.data[1], 'YYYY-MM-DD').format('YYYY-MM-DD');
            return [row.data[0], formattedDate, ...row.data.slice(2)];
        });


        const firstRow = spreadsheetCursor[0]?.data
        const headers = ["account", "date", "amount", "narrative", "category", 'business', 'taxableAmt', 'gst_code', 'gst_amt', 'excl_gst_amt', 'fy', 'qtr', 'itr_label', 'bas_labn']
        const additionalHeaders = []

        if (firstRow.length > headers.length) {
            const extraHeaders = firstRow.slice(headers.length + 1);
            headers.push(...extraHeaders);
            additionalHeaders.push(...extraHeaders);
        }

        const normalizedCsv = newCsv.map(row => {
            const missingLength = headers.length - row.length;
            return missingLength > 0 ? [...row, ...Array(missingLength).fill("")] : row;
        });


        const oldData = [headers, ...formattedData]
        const trimmedNewCsv = normalizedCsv.slice(1).filter(row => row.some(cell => cell.trim() !== ''));

        const filteredNewCsv = removeMatchedItems(trimmedNewCsv, spreadsheetCursor)

        let spreadsheetId;
        if (filteredNewCsv.length > 0) {
            const baseName = fileName.split('.')[0];
            spreadsheetId = await createSpreadsheetList(user?.email, id, baseName)
        }

        if (oldData.length > 1 && filteredNewCsv.length > 0) {
            await train(oldData, id)
            const classifiedData = await classify([headers, ...filteredNewCsv], id, database, user?.email)
            const newClassifiedData = await checkInterBank(spreadsheetCursor, classifiedData, id, spreadsheetId, userSpreadsheet)

            const newData = newClassifiedData.map((data) => {
                return {
                    client_id: new ObjectId(id),
                    spreadsheet: new ObjectId(spreadsheetId),
                    data: data.slice(0, -1),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    inter_bank: false,
                    category: data[4]
                }
            })

            await userSpreadsheet.insertMany(newData)
        } else {
            const insertData = filteredNewCsv.map((data) => {
                return {
                    client_id: new ObjectId(id),
                    spreadsheet: new ObjectId(spreadsheetId),
                    data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    inter_bank: false,
                    category: data[4]
                }
            })
            if (insertData.length > 0) {
                await userSpreadsheet.insertMany(insertData)
            }
        }

        return res.status(200).json({
            error: false,
            message: "Client spreadsheet created successfully.",
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server error");
    } finally {
        await mongoClient.close();
    }
}


const autoCategorize = async (req, res) => {
    try {
        const { id } = req.params;
        const { fromDate, toDate } = req.body

        const startDate = fromDate ? moment(fromDate, 'MM/DD/YYYY').format('YYYY-MM-DD') : moment().startOf('year').format('YYYY-MM-DD');
        const endDate = toDate ? moment(toDate, 'MM/DD/YYYY').format('YYYY-MM-DD') : moment().endOf('year').format('YYYY-MM-DD');

        const client = await getClient(id);
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client does not exist.",
            });
        }

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);

        const collections = await database.listCollections().toArray();
        const collectionExists = collections.some(col => col.name === `${user?.email.split("@")[0]}_client_spreadsheet`);

        if (!collectionExists) {
            await database.createCollection(`${user?.email.split("@")[0]}_client_spreadsheet`);
        }

        const userSpreadsheet = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);

        const spreadsheetCursor = await userSpreadsheet.find({ client_id: new ObjectId(id) }).toArray();

        const filteredData = spreadsheetCursor.filter((record) => {
            if (record.data[3] && record.data[4]) {
                const dateInString = record.data[1];
                const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

                if (dateInRecord.isValid()) {
                    return dateInRecord.isBetween(startDate, endDate, null, '[]');
                }
            }
        });

        const formattedData = filteredData.map((row) => {
            const formattedDate = moment(row.data[1], 'YYYY-MM-DD').format('YYYY-MM-DD');
            return [row.data[0], formattedDate, ...row.data.slice(2), row?._id];
        });

        if (formattedData && formattedData?.length === 0) {
            return res.status(200).json({
                error: true,
                message: "Please select at least one category to proceed.",
            });
        }

        const newData = spreadsheetCursor.filter((record) => {
            if (!record.data[4]) {
                const dateInString = record.data[1];
                const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

                if (dateInRecord.isValid()) {
                    return dateInRecord.isBetween(startDate, endDate, null, '[]');
                }
            }
        });

        const firstRow = spreadsheetCursor[0]?.data
        const headers = ["account", "date", "amount", "narrative", "category", 'business', 'taxableAmt', 'gst_code', 'gst_amt', 'excl_gst_amt', 'fy', 'qtr', 'itr_label', 'bas_labn']
        const additionalHeaders = []

        if (firstRow.length > headers.length) {
            const extraHeaders = firstRow.slice(headers.length + 1);
            headers.push(...extraHeaders);
            additionalHeaders.push(...extraHeaders);
        }
        const newCsv = newData.map((row) => {
            const formattedDate = moment(row.data[1], 'YYYY-MM-DD').format('YYYY-MM-DD');
            const newRow = [row.data[0], formattedDate];

            for (let i = 2; i < row?.data?.length; i++) {
                newRow.push(row.data[i] || "");
            }

            while (newRow.length < headers.length) {
                newRow.push("");
            }

            newRow.push(row?._id || "");
            return newRow;
        });

        headers.push('id')

        const oldData = [headers, ...formattedData]


        if (oldData.length > 0 && newCsv.length > 0) {
            await train(oldData, id)
            const classifiedData = await classify([headers, ...newCsv], id, database, user?.email, additionalHeaders)
            const newData = classifiedData.map((data) => {
                const _id = data[data.length - 1];
                const updatedData = data.slice(0, -1);
                return {
                    _id: new ObjectId(_id),
                    data: updatedData,
                    updatedAt: new Date(),
                    category: updatedData[4]
                };
            });

            await Promise.all(
                newData.map((item) =>
                    userSpreadsheet.updateOne(
                        { _id: item._id },
                        { $set: { data: item.data, updatedAt: item.updatedAt, category: item.category } }
                    )
                )
            );
        }
        return res.status(200).json({
            error: false,
            message: "Client spreadsheet categorize successfully.",
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server error");
    }
}

function checkIfItemMatched(item, spreadsheetCursor) {
    const oldCsv = spreadsheetCursor.filter((record) => {
        if (record.data[1]) {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

            return dateInRecord.isValid();
        }
        return false;
    });

    const formattedData = oldCsv.map((row) => {
        const formattedDate = moment(row.data[1], 'YYYY-MM-DD').format('YYYY-MM-DD');
        return [row.data[0], formattedDate, ...row.data.slice(2)];
    });

    let isMatched = false;

    for (let j = 0; j < formattedData.length; j++) {
        if (
            formattedData[j][1] === item[1] &&
            parseFloat(formattedData[j][2]) === parseFloat(item[2]) &&
            formattedData[j][3] === item[3]
        ) {
            isMatched = true;
            break;
        }
    }

    return isMatched;
}

function findNewElements(existingHeaders, headers) {
    const existingHeadersSet = new Set(existingHeaders);
    return headers.reduce((acc, header, index) => {
        if (!existingHeadersSet.has(header)) {
            acc.push({ element: header, index });
        }
        return acc;
    }, []);
}

const updateClientSpreadsheet = async (req, res) => {
    try {
        const { id: clientId } = req.params;
        const { data, heading } = req.body;
        const insertedDataId = []
        const interBankIds = []

        const client = await getClient(clientId);
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client does not exist.",
            });
        }

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                error: true,
                message: "Data must be a non-empty array.",
            });
        }

        const user = await Users.findById(client?.user_id);
        if (!user) {
            return res.status(400).json({
                error: true,
                message: "User associated with client does not exist.",
            });
        }

        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const clientSpreadsheet = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);
        const spreadsheetCursor = await clientSpreadsheet.find({ client_id: new ObjectId(clientId) }).toArray();

        if (heading?.length > 0) {
            const existingRecord = await clientSpreadsheet.findOne({ _id: new ObjectId(spreadsheetCursor[0]._id) });
            const headers = existingRecord.data

            const removedHeader = headers.indexOf(heading[0]);

            if (removedHeader !== -1) {
                headers.splice(removedHeader, 1);
            }
            const transformedArray = spreadsheetCursor.map(({ _id, data }, index) => {
                if (index === 0) {
                    data.splice(removedHeader, 1);
                } else {
                    data.splice(removedHeader - 1, 1);
                }

                return {
                    updateOne: {
                        filter: { _id },
                        update: { $set: { data } },
                    },
                };
            });

            await clientSpreadsheet.bulkWrite(transformedArray);

            return res.status(200).json({
                error: false,
                message: "Client category updated successfully.",
                insertedDataId: [],
                interBankIds: []
            });
        } else {
            const updatePromises = data.map(async (item) => {
                if (item.length > 0) {
                    if (item[0] === "Id") {
                        const headers = ["Id", "Bank_Account", "Date", "Amt", "Narrative", "Categories", 'Business', 'TaxableAmt', 'GST_Code', 'GST_Amt', 'Excl_GST_Amt', 'FY', 'QTR', 'ITR_Label', 'BAS_LabN']
                        if (item.length > headers.length) {
                            const extraItems = item.slice(15);
                            const cleanedExtraItems = extraItems
                                .map((el) => el.replace(/<\/?b>/g, ""))
                                .filter((el) => el !== "");
                            headers.push(...cleanedExtraItems);
                        }

                        const existingRecord = await clientSpreadsheet.findOne({ _id: new ObjectId(spreadsheetCursor[0]._id) });
                        const exsitingHeaders = existingRecord.data

                        if (headers.length !== exsitingHeaders.length) {
                            let newElements
                            if (headers.length > exsitingHeaders.length) {
                                newElements = findNewElements(exsitingHeaders, headers);
                            } else {
                                newElements = findNewElements(headers, exsitingHeaders);
                            }

                            if (newElements) {
                                const indices = newElements.map(n => n.index - 1).sort((a, b) => a - b);
                                const transformedArray = spreadsheetCursor.map(({ _id, data }, index) => {

                                    if (headers.length > exsitingHeaders.length) {
                                        indices.forEach((index, i) => {
                                            data.splice(index + i, 0, ""); 
                                        });
                                    } else {
                                        indices.reverse().forEach(index => {
                                            data.splice(index, 1);
                                        });
                                    }
                                    

                                    if (index !== 0) {
                                        return {
                                            updateOne: {
                                                filter: { _id },
                                                update: { $set: { data } },
                                            },
                                        };
                                    } else {
                                        return null
                                    }
                                })
                                    .filter(item => item !== null);

                                await clientSpreadsheet.bulkWrite(transformedArray);
                            }
                        }

                        const headerId = spreadsheetCursor[0]._id
                        await clientSpreadsheet.updateOne(
                            { _id: headerId },
                            {
                                $set: {
                                    data: headers
                                }
                            }
                        );
                    } else {
                        const id = item.shift();
                        if (id) {
                            const existingRecord = await clientSpreadsheet.findOne({ _id: new ObjectId(id) });

                            if (existingRecord) {
                                const isItemBlank = Object.values(item).every(value => value === '' || value === null || value === undefined);

                                if (isItemBlank) {
                                    await clientSpreadsheet.deleteOne({ _id: new ObjectId(id) });
                                } else {
                                    if (item[1]) {
                                        item[1] = moment(item[1], 'MM/DD/YYYY').format('YYYY-MM-DD');
                                    }

                                    const newData = await interBankForUpdate(spreadsheetCursor, [item], id, clientSpreadsheet, interBankIds)
                                    if (newData.length > 0) {
                                        const row = await clientSpreadsheet.findOneAndUpdate(
                                            { _id: new ObjectId(id) },
                                            {
                                                $set: {
                                                    data: item,
                                                    category: item[4],
                                                    updatedAt: new Date(),
                                                    inter_bank: false,
                                                    inter_bank_with: ''
                                                }
                                            },
                                            { returnOriginal: true }
                                        );

                                        if (row?.inter_bank_with) {
                                            await clientSpreadsheet.updateOne(
                                                { _id: row.inter_bank_with },
                                                {
                                                    $set: {
                                                        inter_bank: false,
                                                        inter_bank_with: ''
                                                    }
                                                });
                                            interBankIds.push([transformObjectId(id), transformObjectId(row.inter_bank_with), false])
                                        }
                                    }
                                }
                            }
                        } else {
                            if (item[1]) {
                                item[1] = moment(item[1], 'MM/DD/YYYY').format('YYYY-MM-DD');
                            }

                            const isMatched = checkIfItemMatched(item, spreadsheetCursor)
                            if (!isMatched && item[1]) {
                                const newData = await checkInterBank(spreadsheetCursor, [item], clientId, null, clientSpreadsheet, insertedDataId, interBankIds)
                                if (newData.length > 0) {
                                    const insertedId = await clientSpreadsheet.insertOne({
                                        data: item,
                                        category: item[4] ? item[4] : "",
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                        client_id: new ObjectId(clientId),
                                        spreadsheet: null,
                                        inter_bank: false
                                    });
                                    insertedDataId.push(insertedId?.insertedId)
                                }
                            }
                        }
                    }
                }
            });

            await Promise.all(updatePromises);

            return res.status(200).json({
                error: false,
                message: "Client category updated successfully.",
                insertedDataId,
                interBankIds
            });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            error: true,
            message: 'Server error.',
        });
    } finally {
        await mongoClient.close();
    }
};


const generateClientCode = async (user_id) => {
    const lastRecord = await Clients.findOne({ user_id }).sort({ _id: -1 });

    let newClientCode;
    if (lastRecord) {
        const lastClientCode = lastRecord.client_code;
        const lastNumber = parseInt(lastClientCode.slice(2), 10);
        const newNumber = lastNumber + 1;
        if (newNumber) {
            newClientCode = `000${newNumber}`;
        } else {
            newClientCode = `0001`;
        }
    } else {
        newClientCode = `0001`;
    }

    return {
        error: false,
        message: "Client code fetched successfully.",
        clientCode: newClientCode
    };
};

const getLastClient = async (req, res) => {
    try {
        const user_id = req?.user._id
        const response = await generateClientCode(user_id)
        res.json(response)
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

const getGstReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { fromDate, toDate } = req.query;

        const client = await getClient(id);
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client does not exist."
            });
        }

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userSpreadsheet = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);

        let startDate, endDate;
        if (fromDate && moment(fromDate, 'YYYY-MM-DD', true).isValid()) {
            startDate = moment(fromDate, 'YYYY-MM-DD');
        } else {
            startDate = moment().startOf('year');
        }

        if (toDate && moment(toDate, 'YYYY-MM-DD', true).isValid()) {
            endDate = moment(toDate, 'YYYY-MM-DD');
        } else {
            endDate = moment().endOf('year');
        }

        let quarters = [];
        let current = moment(startDate).startOf('quarter');
        const end = moment(endDate).endOf('quarter');

        while (current.isBefore(end) || current.isSame(end, 'quarter')) {
            quarters.push(`${current.year()}_Q${current.quarter()}`);
            current.add(1, 'quarter');
        }

        if (quarters.length < 4) {
            const year = quarters[0].split('_')[0];
            quarters = [`${year}_Q1`, `${year}_Q2`, `${year}_Q3`, `${year}_Q4`];
        }

        const spreadsheetCursor = await userSpreadsheet.find({ client_id: new ObjectId(id) }).toArray();

        const filteredData = spreadsheetCursor.filter((record) => {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'YYYY-MM-DD');
            return (
                dateInRecord.isValid() &&
                dateInRecord.isBetween(startDate, endDate, null, '[]')
            );
        });

        const gstCodeObject = {};
        const basLabNObject = {};

        const getQuarter = (date) => `${date.year()}_Q${date.quarter()}`;

        const initializeQuarterResults = () => {
            return quarters.reduce((acc, quarter) => {
                acc[quarter] = 0;
                return acc;
            }, {});
        };

        filteredData.forEach(record => {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'YYYY-MM-DD');
            const taxableAmt = typeof record.data[6] === 'string' ? parseFloat(record.data[6].replace(/,/g, '')) : parseFloat(record.data[6]);
            const gstAmt = typeof record.data[8] === 'string' ? parseFloat(record.data[8].replace(/,/g, '')) : parseFloat(record.data[8]);
            const category = record.data[4];
            const gstCode = record.data[7];
            const basLabn = record.data[13];
            const quarter = getQuarter(dateInRecord);

            if (!gstCodeObject[gstCode]) {
                gstCodeObject[gstCode] = { categories: {}, totals: initializeQuarterResults() };
            }
            if (!gstCodeObject[gstCode].categories[category]) {
                gstCodeObject[gstCode].categories[category] = { ...initializeQuarterResults(), total: 0 };
            }
            if (!basLabNObject[basLabn]) {
                basLabNObject[basLabn] = { categories: {}, totals: initializeQuarterResults() };
            }
            if (!basLabNObject[basLabn].categories[category]) {
                basLabNObject[basLabn].categories[category] = { ...initializeQuarterResults(), total: 0 };
            }

            if (taxableAmt && gstCode && category) {
                gstCodeObject[gstCode].categories[category][quarter] += taxableAmt;
                gstCodeObject[gstCode].categories[category].total += taxableAmt;
                gstCodeObject[gstCode].totals[quarter] += taxableAmt;
                gstCodeObject[gstCode].categories[category][quarter] = parseFloat(gstCodeObject[gstCode].categories[category][quarter].toFixed(2));
                gstCodeObject[gstCode].categories[category].total = parseFloat(gstCodeObject[gstCode].categories[category].total.toFixed(2));
                gstCodeObject[gstCode].totals[quarter] = parseFloat(gstCodeObject[gstCode].totals[quarter].toFixed(2));
            }

            if (gstAmt && basLabn && category) {
                basLabNObject[basLabn].categories[category][quarter] += gstAmt;
                basLabNObject[basLabn].categories[category].total += gstAmt;
                basLabNObject[basLabn].totals[quarter] += gstAmt;
                basLabNObject[basLabn].categories[category][quarter] = parseFloat(basLabNObject[basLabn].categories[category][quarter].toFixed(2));
                basLabNObject[basLabn].categories[category].total = parseFloat(basLabNObject[basLabn].categories[category].total.toFixed(2));
                basLabNObject[basLabn].totals[quarter] = parseFloat(basLabNObject[basLabn].totals[quarter].toFixed(2));
            }
        });

        const formatResult = (resultObject) => {
            return Object.keys(resultObject).map(key => {
                if (!key) return null;
                const categories = resultObject[key].categories;
                const totals = resultObject[key].totals;

                if (Object.keys(categories).length === 0) return null;

                const categoryRows = Object.keys(categories).map(category => ({
                    BAS_Name: key,
                    Tax_Category: category,
                    ...Object.fromEntries(
                        Object.entries(categories[category]).map(([k, v]) => [k, v.toFixed(2)])
                    )
                }));

                return {
                    basLabn: key,
                    categoryRows,
                    totalRow: {
                        BAS_Name: key,
                        Tax_Category: "Total Result",
                        ...Object.fromEntries(
                            Object.entries(totals).map(([k, v]) => [k, v.toFixed(2)])
                        ),
                        Total_Result: Object.values(totals).reduce((acc, val) => acc + val, 0).toFixed(2) || "0.00"
                    }
                };
            }).filter(result => result !== null);
        };

        const gstCodeResult = formatResult(gstCodeObject);
        const basLabnResult = formatResult(basLabNObject);

        const gstCodeGrandTotal = initializeQuarterResults();
        const basLabnGrandTotal = initializeQuarterResults();

        gstCodeResult.forEach(bas => {
            Object.keys(bas.totalRow).forEach(key => {
                if (key && key !== 'BAS_Name' && key !== 'Total_Result' && key !== 'Tax_Category') {
                    gstCodeGrandTotal[key] += parseFloat(bas.totalRow[key]);
                }
            });
        });

        basLabnResult.forEach(bas => {
            Object.keys(bas.totalRow).forEach(key => {
                if (key && key !== 'BAS_Name' && key !== 'Total_Result' && key !== 'Tax_Category') {
                    basLabnGrandTotal[key] += parseFloat(bas.totalRow[key]);
                }
            });
        });

        gstCodeGrandTotal.Total_Result = gstCodeResult.length > 0
            ? Object.values(gstCodeGrandTotal).reduce((acc, val) => acc + val, 0).toFixed(2)
            : "0.00";
        basLabnGrandTotal.Total_Result = basLabnResult.length > 0
            ? Object.values(basLabnGrandTotal).reduce((acc, val) => acc + val, 0).toFixed(2)
            : "0.00";

        const formatGrandTotal = (grandTotal, label) => {
            Object.keys(grandTotal).forEach(key => {
                if (typeof grandTotal[key] === 'number') {
                    grandTotal[key] = grandTotal[key].toFixed(2);
                }
            });
            return {
                ...grandTotal,
                BAS_Name: label,
                Tax_Category: "",
            };
        };

        const formattedBasLabnGrandTotal = formatGrandTotal(basLabnGrandTotal, "Total");
        const formattedGstCodeGrandTotal = formatGrandTotal(gstCodeGrandTotal, "Total");

        res.json({
            error: false,
            message: "Client report fetched successfully.",
            data: {
                taxableAmtReport: {
                    gstCodeResult,
                    gstCodeGrandTotal: formattedGstCodeGrandTotal
                },
                gstAmtReport: {
                    basLabnResult,
                    basLabnGrandTotal: formattedBasLabnGrandTotal
                }
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const getItrReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { fromDate, toDate } = req.query;

        const client = await getClient(id);
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client does not exist."
            });
        }

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userSpreadsheet = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);

        let startDate, endDate;
        if (fromDate && moment(fromDate, 'YYYY-MM-DD', true).isValid()) {
            startDate = moment(fromDate, 'YYYY-MM-DD');
        } else {
            startDate = moment().startOf('year');
        }

        if (toDate && moment(toDate, 'YYYY-MM-DD', true).isValid()) {
            endDate = moment(toDate, 'YYYY-MM-DD');
        } else {
            endDate = moment().endOf('year');
        }

        const spreadsheetCursor = await userSpreadsheet.find({ client_id: new ObjectId(id) }).toArray();

        const filteredData = spreadsheetCursor.filter((record) => {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'YYYY-MM-DD');
            return dateInRecord.isValid() && dateInRecord.isBetween(startDate, endDate, null, '[]');
        });

        const itrLabelObject = {};
        let grandTotalExcGst = 0;

        filteredData.forEach(record => {
            const excGstAmt = record.data[9]
                ? parseFloat(String(record.data[9]).replace(/,/g, ''))
                : 0;
            const category = record.data[4]
            const itrLabel = record.data[12]

            if (itrLabel && excGstAmt && category) {
                grandTotalExcGst += excGstAmt;

                if (!itrLabelObject[itrLabel]) {
                    itrLabelObject[itrLabel] = { categories: {}, total: 0 };
                }

                if (!itrLabelObject[itrLabel].categories[category]) {
                    itrLabelObject[itrLabel].categories[category] = 0;
                }

                itrLabelObject[itrLabel].categories[category] += excGstAmt;
                itrLabelObject[itrLabel].total += excGstAmt;
            }
        });

        const formattedResult = [];

        Object.keys(itrLabelObject).forEach(itrLabel => {
            const categories = itrLabelObject[itrLabel].categories;

            formattedResult.push({
                ITR_Label: itrLabel,
                Tax_Category: '',
                Sum_of_Exc_GST_Amt: itrLabelObject[itrLabel].total.toFixed(2)
            });

            Object.keys(categories).forEach(category => {
                formattedResult.push({
                    ITR_Label: '',
                    Tax_Category: category,
                    Sum_of_Exc_GST_Amt: categories[category].toFixed(2),
                });
            });
        });

        res.json({
            error: false,
            message: "Client ITR report fetched successfully.",
            data: {
                excGstResult: formattedResult,
                grandTotalExcGst: grandTotalExcGst.toFixed(2)
            }
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

const changeSheetName = async (req, res) => {
    try {
        const { id } = req.params;
        const { sheet_name } = req.body

        const client = await getClient(id);
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client is not existing."
            });
        }

        await Clients.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    sheet_name,
                }
            }
        );

        return res.status(200).json({
            error: false,
            message: "Sheet name changed successfully."
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
}

const generateRandomToken = () => {
    return crypto.randomBytes(15).toString('hex');
};

const shareSpreadsheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_shared } = req.body


        const client = await getClient(id);
        if (!client) {
            return res.status(400).json({
                error: true,
                message: "Client is not existing."
            });
        }

        const user = await Users.findById(client?.user_id);
        if (!user) {
            return res.status(400).json({
                error: true,
                message: "User associated with client does not exist.",
            });
        }

        const token = generateRandomToken()

        await Clients.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    is_shared: is_shared ? true : false,
                    token: is_shared ? token : ""
                }
            }
        );

        return res.status(200).json({
            error: false,
            message: `Sheet sharing is ${is_shared ? 'enabled' : 'disabled'}.`,
            url: is_shared ? `${process.env.CLIENT_SIDE_URL}/collabrative-sheet/${token}` : ''
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
}

module.exports = {
    createClient, getSingleClient, getClientCategory, getAllClients,
    exportClient, createClientSpreadsheet, getSpreadsheet,
    autoCategorize, getClientSpreadsheets, getSpreadsheetData,
    updateClient, updateClientCategory, deleteClient, clientImport,
    bulkClientDelete, updateClientSpreadsheet, getLastClient, getGstReport,
    getItrReport, deleteSpreadSheetData, changeSheetName, shareSpreadsheet, getSharedClient
}