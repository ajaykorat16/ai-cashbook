const Users = require("../models/userModel");
const Clients = require("../models/clientModel")
const { MongoClient, ObjectId } = require('mongodb');
const mongoClient = new MongoClient(process.env.DATABASE_URL);
const { validationResult } = require('express-validator');
const { isValidEmail, createUserClientCategoryCollection, createBlankSpreadsheet } = require("../helpers/helper");
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const csv = require('csv-parser');

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
            address
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
                    individual: "false"
                }
            } else {
                return {
                    ...client.toObject(),
                    individual: "true"
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

const updateClientCategory = async (req, res) => {
    try {
        const { id } = req.params
        const { data } = req.body

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

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userCategory = database.collection(`${user?.email.split("@")[0]}_client_category`);

        const clientCatgory = await userCategory.findOneAndUpdate(
            { client_id: new ObjectId(id) },
            { $set: { data } },
            { returnOriginal: false }
        );
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
        if (individual == "true" || individual == "TRUE") {
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
        } else {
            if (!entity_name || entity_name.length < 2) {
                const errorObj = {
                    field: "entity_name",
                    message: "Entity name is required and must be at least two characters long."
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
                    message: "Abn number should be unique."
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
        if (individual == "true" || individual == "TRUE") {
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
        } else {
            if (!entity_name || entity_name.length < 2) {
                const errorObj = {
                    field: "entity_name",
                    message: "Entity name is required and must be at least two characters long."
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
                    message: "Abn number should be unique."
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
        let successImports = 0
        let failedImports = 0
        let { clients, isInsert } = req.body
        const user_id = req.user._id
        clients = JSON.parse(clients)
        const failedClients = []

        for (const client of clients) {
            const { client_code } = client

            const [existingClient] = await Clients.find({ client_code, user_id })

            if (existingClient) {
                const updatedClient = await validateAndUpdateClient(client, existingClient?._id, user_id, isInsert)
                if (updatedClient.error) {
                    failedImports += 1
                } else {
                    successImports += 1
                }
                failedClients.push({
                    ...client,
                    errors: updatedClient?.errors
                })
            } else {
                const newClient = await validateAndCreateClient(client, user_id, isInsert)
                if (newClient.error) {
                    failedImports += 1
                } else {
                    successImports += 1
                }
                failedClients.push({
                    ...client,
                    errors: newClient?.errors
                })
            }
        };

        if (isInsert) {
            return res.status(200).json({
                error: false,
                message: `${successImports} clients imported successfully${failedImports > 0 ? `, ${failedImports} skipped with error.` : "."} `,
                failedClients
            })
        } else {
            if (failedImports > 0) {
                return res.status(200).json({
                    error: true,
                    message: `You have error in your file, please improve the data and upload again.`,
                    failedClients
                })
            } else {
                return res.status(200).json({
                    error: false,
                    message: `You file is  validated and ready to import, please verify data and press upload.`,
                    failedClients
                })
            }
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}

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

        const startDate = fromDate ? moment(fromDate, 'MM/DD/YYYY') : moment().startOf('year');
        const endDate = toDate ? moment(toDate, 'MM/DD/YYYY') : moment().endOf('year');
        const spreadsheetCursor = await userSpreadsheet.find({ client_id: new ObjectId(id) }).toArray();

        const filteredData = spreadsheetCursor.filter((record) => {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'MM/DD/YYYY');

            if (dateInRecord.isValid()) {
                return dateInRecord.isBetween(startDate, endDate, null, '[]');
            }
        });

        const data = filteredData.map((row) => {
            return [row._id, ...row.data];
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
            spreadsheet: [spreadsheetCursor[0].data, ...data]
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

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
            .on('error', (err) => {
                reject(err); 
            });
    });
};

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
};


const classify = async (newData, id) => {
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

    // const data = await readCsv(filePath);
    // console.log('data---',data)
}

const createClientSpreadsheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = req.body;

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

        const newCsv = [["Bank Account", "Date", "Narrative", "Amt", "Categories"]]

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);

        if (data[0][0] === "Bank Account") {
            data.shift();
            data.forEach(row => {
                const [bankAccount, date, narrative, debitAmt, creditAmt, category] = row;
                let amount = '';
                if (creditAmt) {
                    amount = `${parseFloat(creditAmt).toLocaleString()}`;
                } else if (debitAmt) {
                    amount = `-${parseFloat(debitAmt).toLocaleString()}`;
                }

                newCsv.push([bankAccount, date, narrative, amount, category]);
            })
        } else {
            if (data[0].length === 3) {
                data.forEach(row => {
                    const [date, amount, narrative] = row;
                    newCsv.push(["", date, narrative, amount]);
                });
            } else if (data[0].length === 4) {
                if (data[0][0] === "Account History for Account:") {
                    const accountNumber = data[0][1].split("-")[1].trim();
                    data.splice(0, 2);

                    data.forEach(row => {
                        const [date, narrative, amount] = row;
                        newCsv.push([accountNumber, date, narrative, amount]);
                    });
                } else {
                    data.forEach(row => {
                        const [date, amount, narrative] = row;
                        newCsv.push(["", date, narrative, amount]);
                    });
                }
            } else if (data[0].length === 7) {
                data.forEach(row => {
                    const [date, amount, str1, str2, narrative1, narrative2] = row;
                    const narrative = `${narrative2} ${narrative1}`;

                    newCsv.push(["", date, narrative, amount]);
                });
            }
        }

        const collections = await database.listCollections().toArray();
        const collectionExists = collections.some(col => col.name === `${user?.email.split("@")[0]}_client_spreadsheet`);

        if (!collectionExists) {
            await database.createCollection(`${user?.email.split("@")[0]}_client_spreadsheet`);
        }

        const userSpreadsheet = database.collection(`${user?.email.split("@")[0]}_client_spreadsheet`);

        const startDate = moment().startOf('year');
        const endDate = moment().endOf('year');
        const spreadsheetCursor = await userSpreadsheet.find({ client_id: new ObjectId(id) }).toArray();

        const filteredData = spreadsheetCursor.filter((record) => {
            if(record.data[4]) {
                const dateInString = record.data[1];
                const dateInRecord = moment(dateInString, 'MM/DD/YYYY');
    
                if (dateInRecord.isValid()) {
                    return dateInRecord.isBetween(startDate, endDate, null, '[]');
                }
            }
        });

        const formattedData = filteredData.map((row) => {
            return row.data;
        });

        const oldData = [["bank_account", "date", "narrative", "amt", "categories"], ...formattedData]
        const trimmedNewCsv = newCsv.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
        if (oldData.length > 1) {
            await train(oldData, id)
            classify([oldData[0],...trimmedNewCsv], id)
        } else {

            const insertData = trimmedNewCsv.map((data) => {
                return {
                    client_id: new ObjectId(id),
                    data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })

            await userSpreadsheet.insertMany(insertData)
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

const updateClientSpreadsheet = async (req, res) => {
    try {
        const { id: clientId } = req.params;
        const { data } = req.body;
        const insertedDataId = []

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

        const updatePromises = data.map(async (item) => {
            if (item.length > 0) {
                if (item[0] === "Id") {
                    const spreadsheetCursor = await clientSpreadsheet.find({ client_id: new ObjectId(clientId) }).toArray();
                    const headerId = spreadsheetCursor[0]._id
                    await clientSpreadsheet.updateOne(
                        { _id: headerId },
                        {
                            $set: {
                                data: item,
                            }
                        }
                    );
                } else {
                    const id = item.shift();
                    const existingRecord = await clientSpreadsheet.findOne({ _id: new ObjectId(id) });

                    if (existingRecord) {
                        const isItemBlank = Object.values(item).every(value => value === '' || value === null || value === undefined);

                        if (isItemBlank) {
                            await clientSpreadsheet.deleteOne({ _id: new ObjectId(id) });
                        } else {
                            await clientSpreadsheet.updateOne(
                                { _id: new ObjectId(id) },
                                {
                                    $set: {
                                        data: item,
                                        updatedAt: new Date(),
                                    }
                                }
                            );
                        }
                    } else {
                        const insertedId = await clientSpreadsheet.insertOne({
                            data: item,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            client_id: new ObjectId(clientId)
                        });
                        insertedDataId.push(insertedId?.insertedId)
                    }
                }
            }
        });

        await Promise.all(updatePromises);

        return res.status(200).json({
            error: false,
            message: "Client category updated successfully.",
            insertedDataId
        });
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

module.exports = {
    createClient, getSingleClient, getClientCategory, getAllClients, exportClient, createClientSpreadsheet, getSpreadsheet,
    updateClient, updateClientCategory, deleteClient, clientImport, bulkClientDelete, updateClientSpreadsheet, getLastClient
}