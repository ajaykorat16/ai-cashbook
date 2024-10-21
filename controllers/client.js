const Users = require("../models/userModel");
const Clients = require("../models/clientModel")
const { MongoClient, ObjectId } = require('mongodb');
const mongoClient = new MongoClient(process.env.DATABASE_URL);
const { validationResult } = require('express-validator');
const { isValidEmail, createUserClientCategoryCollection, createBlankSpreadsheet } = require("../helpers/helper");
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { spawn } = require("child_process");


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

function runPythonScript(operation, userId, filePath) {
    return new Promise((resolve, reject) => {
        const parentDirectory = path.join(__dirname, '../ac-text-classifier/');
        const pythonScriptPath = path.join(parentDirectory, "main.py");

        const args = [pythonScriptPath, operation, userId, filePath];

        const pythonProcess = spawn("python3.10", args);

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


const classify = async (newData, id, database, email) => {
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
        let bas_code = ''
        let itr_label = ''

        if (row?.category) {
            const [category] = clientCategory.data.filter(c => c[0] == row.category);
            gst_code = category[2]
            bas_code = category[3]
            itr_label = category[4]
        }

        return [
            row.account,
            row.date,
            row.amount,
            row.category,
            row.business,
            row.taxableAmt,
            gst_code,
            bas_code,
            row.gst_amt,
            row.excl_gst_amt,
            row.fy,
            row.qtr,
            itr_label,
            row.bas_labn,
        ]
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

        const newCsv = [["Bank Account", "Date", "Amt", "Categories", 'Business%', 'TaxableAmt', 'GST_Code', 'BAS_Code', 'GST_Amt', 'Excl.GST_Amt', 'FY', 'QTR', 'ITR_Label', 'BAS_LabN']]

        const user = await Users.findById(client?.user_id);
        await mongoClient.connect();
        const database = mongoClient.db(process.env.DATABASE_NAME);

        if (data[0][0] === "Bank Account") {
            data.shift();
            data.forEach(row => {
                const [bankAccount, date, narrative, debitAmt, creditAmt, otherCat, serial, business] = row;
                let amount = '';
                if (creditAmt) {
                    amount = parseFloat(creditAmt.replace(/,/g, ''));
                } else if (debitAmt) {
                    amount = -parseFloat(debitAmt.replace(/,/g, ''));
                }

                const businessRate = parseInt(business.replace('%', ''));
                const taxable_amt = (amount / businessRate).toFixed(2);
                const gst_amt = (taxable_amt / 11).toFixed(2);
                const exc_gst = (taxable_amt - gst_amt).toFixed(2);
                const bs_labn = gst_amt > 0 ? "1A" : "1B"

                if (date) {
                    const formattedDate = moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');
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

                    newCsv.push([bankAccount, formattedDate, amount, '', businessRate, taxable_amt, '', '', gst_amt, exc_gst, financialYear, quarterRange, '', bs_labn]);
                }
            })
        } else {
            if (data[0].length === 4) {
                data.forEach(row => {
                    const [date, amount, narrative, business] = row;
                    const businessRate = parseInt(business.replace('%', ''));
                    const taxable_amt = (amount / businessRate).toFixed(2);
                    const gst_amt = (taxable_amt / 11).toFixed(2);
                    const exc_gst = (taxable_amt - gst_amt).toFixed(2);
                    const bs_labn = gst_amt > 0 ? "1A" : "1B"

                    if (date) {
                        const formattedDate = moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');
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
                        newCsv.push(["", formattedDate, amount, '', businessRate, taxable_amt, '', '', gst_amt, exc_gst, financialYear, quarterRange, '', bs_labn]);
                    }
                });
            } else if (data[0].length === 5) {
                if (data[0][0] === "Account History for Account:") {
                    const accountNumber = data[0][1].split("-")[1].trim();
                    data.splice(0, 2);

                    data.forEach(row => {
                        const [date, narrative, amount, otherAmt, business] = row;
                        const cleanAmount = parseFloat(amount.replace(/[$,]/g, ''));
                        const businessRate = parseInt(business.replace('%', ''));
                        const taxable_amt = (amount / businessRate).toFixed(2);
                        const gst_amt = (taxable_amt / 11).toFixed(2);
                        const exc_gst = (taxable_amt - gst_amt).toFixed(2);
                        const bs_labn = gst_amt > 0 ? "1A" : "1B"

                        if (date) {
                            const formattedDate = moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');
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

                            newCsv.push([accountNumber, formattedDate, cleanAmount, '', businessRate, taxable_amt, '', '', gst_amt, exc_gst, financialYear, quarterRange, '', bs_labn]);
                        }
                    });
                } else {
                    data.forEach(row => {
                        const [date, amount, narrative, otherAmt, business] = row;

                        const businessRate = parseInt(business.replace('%', ''));
                        const taxable_amt = (amount / businessRate).toFixed(2);
                        const gst_amt = (taxable_amt / 11).toFixed(2);
                        const exc_gst = (taxable_amt - gst_amt).toFixed(2);
                        const bs_labn = gst_amt > 0 ? "1A" : "1B"

                        if (date) {
                            const formattedDate = moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');
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

                            newCsv.push(["", formattedDate, amount, '', businessRate, taxable_amt, '', '', gst_amt, exc_gst, financialYear, quarterRange, '', bs_labn]);
                        }
                    });
                }
            } else if (data[0].length === 8) {
                data.forEach(row => {
                    const [date, amount, str1, str2, narrative1, narrative2, otherAmt, business] = row;
                    const businessRate = parseInt(business.replace('%', ''));
                    const taxable_amt = (amount / businessRate).toFixed(2);
                    const gst_amt = (taxable_amt / 11).toFixed(2);
                    const exc_gst = (taxable_amt - gst_amt).toFixed(2);
                    const bs_labn = gst_amt > 0 ? "1A" : "1B"

                    if (date) {
                        const formattedDate = moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');
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

                        newCsv.push(["", formattedDate, amount, '', businessRate, taxable_amt, '', '', gst_amt, exc_gst, financialYear, quarterRange, '', bs_labn]);
                    }
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
            if (record.data[3]) {
                const dateInString = record.data[1];
                const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

                if (dateInRecord.isValid()) {
                    return dateInRecord.isBetween(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'), null, '[]');
                }
            }
        });

        const formattedData = filteredData.map((row) => {
            const formattedDate = moment(row.data[1], 'YYYY-MM-DD').format('YYYY-MM-DD');
            return [row.data[0], formattedDate, ...row.data.slice(2)];
        });

        const oldData = [["account", "date", "amount", "category", 'business', 'taxableAmt', 'gst_code', 'bas_code', 'gst_amt', 'excl_gst_amt', 'fy', 'qtr', 'itr_label', 'bas_labn'], ...formattedData]
        const trimmedNewCsv = newCsv.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
        if (oldData.length > 1) {
            await train(oldData, id)
            const classifiedData = await classify([oldData[0], ...trimmedNewCsv], id, database, user?.email)
            const newData = classifiedData.map((data) => {
                return {
                    client_id: new ObjectId(id),
                    data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            })

            await userSpreadsheet.insertMany(newData)
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
                            if (item[1]) {
                                item[1] = moment(item[1], 'MM/DD/YYYY').format('YYYY-MM-DD');
                            }

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
                        if (item[1]) {
                            item[1] = moment(item[1], 'MM/DD/YYYY').format('YYYY-MM-DD');
                        }

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

        const quarters = [];
        let current = moment(startDate).startOf('quarter');
        const end = moment(endDate).endOf('quarter');

        while (current.isBefore(end) || current.isSame(end, 'quarter')) {
            quarters.push(`${current.year()}_Q${current.quarter()}`);
            current.add(1, 'quarter');
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

        const basCodeObject = {};
        const basLabNObject = {};

        const getQuarter = (date) => {
            return `${date.year()}_Q${date.quarter()}`;
        };

        const initializeQuarterResults = () => {
            return quarters.reduce((acc, quarter) => {
                acc[quarter] = 0;
                return acc;
            }, {});
        };


        filteredData.forEach(record => {
            const dateInString = record.data[1];
            const dateInRecord = moment(dateInString, 'YYYY-MM-DD');

            const taxableAmt = typeof record.data[5] === 'string' ? parseFloat(record.data[5].replace(/,/g, '')) : parseFloat(record.data[5]);
            const gstAmt = typeof record.data[8] === 'string' ? parseFloat(record.data[8].replace(/,/g, '')) : parseFloat(record.data[8]);
            const category = record.data[3];
            const basCode = record.data[7];
            const basLabn = record.data[13];
            const quarter = getQuarter(dateInRecord);

            if (!basCodeObject[basCode]) {
                basCodeObject[basCode] = { categories: {}, totals: initializeQuarterResults() };
            }

            if (!basCodeObject[basCode].categories[category]) {
                basCodeObject[basCode].categories[category] = { ...initializeQuarterResults(), total: 0 };
            }

            if (!basLabNObject[basLabn]) {
                basLabNObject[basLabn] = { categories: {}, totals: initializeQuarterResults() };
            }

            if (!basLabNObject[basLabn].categories[category]) {
                basLabNObject[basLabn].categories[category] = { ...initializeQuarterResults(), total: 0 };
            }

            if (taxableAmt && basCode && category) {
                basCodeObject[basCode].categories[category][quarter] += taxableAmt;
                basCodeObject[basCode].categories[category].total += taxableAmt;
                basCodeObject[basCode].totals[quarter] += taxableAmt;

                // Format totals to 2 decimal places
                basCodeObject[basCode].categories[category][quarter] = parseFloat(basCodeObject[basCode].categories[category][quarter].toFixed(2));
                basCodeObject[basCode].categories[category].total = parseFloat(basCodeObject[basCode].categories[category].total.toFixed(2));
                basCodeObject[basCode].totals[quarter] = parseFloat(basCodeObject[basCode].totals[quarter].toFixed(2));
            }

            if (gstAmt && basLabn && category) {
                basLabNObject[basLabn].categories[category][quarter] += gstAmt;
                basLabNObject[basLabn].categories[category].total += gstAmt;
                basLabNObject[basLabn].totals[quarter] += gstAmt;

                // Format totals to 2 decimal places
                basLabNObject[basLabn].categories[category][quarter] = parseFloat(basLabNObject[basLabn].categories[category][quarter].toFixed(2));
                basLabNObject[basLabn].categories[category].total = parseFloat(basLabNObject[basLabn].categories[category].total.toFixed(2));
                basLabNObject[basLabn].totals[quarter] = parseFloat(basLabNObject[basLabn].totals[quarter].toFixed(2));
            }
        });

        const formatResult = (resultObject) => {
            return Object.keys(resultObject).map(key => {
                if (!key) {
                    return null;
                }

                const categories = resultObject[key].categories;
                const totals = resultObject[key].totals;

                if (Object.keys(categories).length === 0) {
                    return null;
                }

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
                        Total_Result: Object.values(totals).reduce((acc, val) => acc + val, 0).toFixed(2)
                    }
                };
            }).filter(result => result !== null)
        };


        const basCodeResult = formatResult(basCodeObject);
        const basLabnResult = formatResult(basLabNObject);

        const basCodeGrandTotal = initializeQuarterResults();
        const basLabnGrandTotal = initializeQuarterResults();

        basCodeResult.forEach(bas => {
            Object.keys(bas.totalRow).forEach(key => {
                if (key && key !== 'BAS_Name' && key !== 'Total_Result' && key !== 'Tax_Category') {
                    basCodeGrandTotal[key] += parseFloat(bas.totalRow[key]);
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

        basCodeGrandTotal.Total_Result = (filteredData.length > 0) ? Object.values(basCodeGrandTotal).reduce((acc, val) => acc + val, 0).toFixed(2) : "";
        basLabnGrandTotal.Total_Result = (filteredData.length > 0) ? Object.values(basLabnGrandTotal).reduce((acc, val) => acc + val, 0).toFixed(2) : "";

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
        const formattedBasCodeGrandTotal = formatGrandTotal(basCodeGrandTotal, "Total");

        res.json({
            error: false,
            message: "Client report fetched successfully.",
            data: {
                taxableAmtReport: {
                    basCodeResult,
                    basCodeGrandTotal: formattedBasCodeGrandTotal
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
            const excGstAmt = record.data[5] ? parseFloat(record.data[5].replace(/,/g, '')) : 0;
            const category = record.data[3]
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

module.exports = {
    createClient, getSingleClient, getClientCategory, getAllClients, exportClient, createClientSpreadsheet, getSpreadsheet,
    updateClient, updateClientCategory, deleteClient, clientImport, bulkClientDelete, updateClientSpreadsheet, getLastClient, getGstReport, getItrReport
}