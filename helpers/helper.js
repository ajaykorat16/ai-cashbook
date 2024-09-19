const fs = require("fs")
const hbs = require("handlebars")
const { MongoClient, ObjectId } = require('mongodb');
const mongoClient = new MongoClient(process.env.DATABASE_URL);
const bcrypt = require("bcrypt");
const saltRounds = 10;

const hashPassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.log(error);
    }
};

const comparePassword = async (password, hashPassword) => {
    try {
        return bcrypt.compare(password, hashPassword);
    } catch (error) {
        console.log(error);
    }
};

const compile = function (data, template) {
    try {
        var html = fs.readFileSync(template, "utf8")
        const templateScript = hbs.compile(html)

        const res = templateScript(data)
        return res
    } catch (error) {
        console.error('Error reading the file:', error.message);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

const createUserMasterCategoryCollection = async (user, id) => {
    fs.readFile('./data_dump/category.json', 'utf8', async (err, jsonData) => {
        if (err) {
            console.error('Error reading file:', err);
        }

        try {
            await mongoClient.connect();

            const database = mongoClient.db(process.env.DATABASE_NAME);
            const collections = await database.listCollections().toArray();

            const collectionExists = collections.some(col => col.name === `${user?.email.split("@")[0]}_master_category`);
            if (!collectionExists) {
                await database.createCollection(`${user?.email.split("@")[0]}_master_category`);
            }

            const userCategory = database.collection(`${user?.email.split("@")[0]}_master_category`);

            const userCategoryData = {
                user_id: user._id,
                data: JSON.parse(jsonData)?.data
            }

            await userCategory.insertOne(userCategoryData);
        } catch (error) {
            console.error('Error create user master category collection:', error);
        }
    });
}

const createUserClientCategoryCollection = async (user, client_id) => {
    try {
        await mongoClient.connect();

        const database = mongoClient.db(process.env.DATABASE_NAME);
        const userCategoryCollection = database.collection(`${user?.email.split("@")[0]}_master_category`);

        const userCategoryData = await userCategoryCollection.findOne({ user_id: new ObjectId(user?._id) });
        if (userCategoryData?.data) {

            const collections = await database.listCollections().toArray();

            const collectionExists = collections.some(col => col.name === `${user?.email.split("@")[0]}_client_category`);
            if (!collectionExists) {
                await database.createCollection(`${user?.email.split("@")[0]}_client_category`);
            }

            const userCategory = database.collection(`${user?.email.split("@")[0]}_client_category`);

            const clientCategoryData = {
                client_id,
                data: userCategoryData.data
            }

            await userCategory.insertOne(clientCategoryData);
        }
    } catch (error) {
        console.error('Error create user client category collection:', error);
    }
}

const createBlankSpreadsheet = async (email, id) => {
    try {
        await mongoClient.connect();

        const database = mongoClient.db(process.env.DATABASE_NAME);
        const collections = await database.listCollections().toArray();

        const collectionExists = collections.some(col => col.name === `${email.split("@")[0]}_client_spreadsheet`);

        if (!collectionExists) {
            await database.createCollection(`${email.split("@")[0]}_client_spreadsheet`);
        }

        const userSpreadsheet = database.collection(`${email.split("@")[0]}_client_spreadsheet`);

        const spreadsheet = {
            client_id: id,
            data:[["Bank Account", "Date", "Narrative", "Amt", "Categories"]],
            createdAt: new Date(),
            updatedAt: new Date()
        }

        await userSpreadsheet.insertOne(spreadsheet);
    } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
    }
}

module.exports = {
    hashPassword,
    comparePassword,
    compile,
    isValidEmail,
    createUserMasterCategoryCollection,
    createUserClientCategoryCollection,
    createBlankSpreadsheet
}