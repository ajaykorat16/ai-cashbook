const Clients = require("../models/clientModel")
const Users = require("../models/userModel");
const { isValidEmail, createCollection } = require("../helpers/helper");
const fs = require("fs")
const { validationResult } = require('express-validator');
const { MongoClient, ObjectId } = require('mongodb');
const mongoClient = new MongoClient(process.env.DATABASE_URL);

const createClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { first_name, last_name, entity_name, user_id, abn_number, preferred_name, phone, email, client_code, user_defined, address } = req.body

        if (!first_name && !last_name && !entity_name) {
            return res.status(200).json({
                error: true,
                message: "Plz enter the name.",
            });
        }

        if (email) {
            if (!isValidEmail(email)) {
                return res.status(200).json({
                    error: true,
                    message: "Plz enter valid email.",
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
                    message: "Plz enter valid phone number.",
                });
            } else {
                const existingPhone = await Clients.findOne({ phone, user_id });
                if (existingPhone) {
                    return res.status(200).json({
                        error: true,
                        message: "Phone number should be unique.",
                    });
                }
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
            await createCollection(user, newClient?._id)
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
        const { first_name, last_name, entity_name, user_id, abn_number, preferred_name, phone, email, client_code, user_defined, address } = req.body

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
                message: "Plz enter the name.",
            });
        }

        if (email) {
            if (!isValidEmail(email)) {
                return res.status(200).json({
                    error: true,
                    message: "Plz enter valid email.",
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
                    message: "Plz enter valid phone number.",
                });
            } else {
                const existingPhone = await Clients.findOne({ phone, user_id, _id: { $ne: id } });
                if (existingPhone) {
                    return res.status(200).json({
                        error: true,
                        message: "Phone number should be unique.",
                    });
                }
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
        const client = await Clients.findById({ _id: id })
        return client
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


const deleteClient = async (req, res) => {
    try {
        const { id } = req.params

        const existingClient = await Clients.findById({ _id: id })
        if (!existingClient) {
            return res.status(400).json({
                error: true,
                message: "CLient is not existing."
            })
        }

        const user = await Users.findById(existingClient?.user_id);
        if (user) {
            await deleteClientCategory(user, id)
        }

        await Clients.findByIdAndDelete({ _id: id })
        return res.status(200).json({
            error: false,
            message: "Client deleted successfully.",
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
}


module.exports = { createClient, getSingleClient, getClientCategory, getAllClients, updateClient, updateClientCategory, deleteClient }