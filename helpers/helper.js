const bcrypt = require("bcrypt");
const saltRounds = 10;
const fs = require("fs")
const hbs = require("handlebars")
const { MongoClient } = require('mongodb');
const mongoClient = new MongoClient(process.env.DATABASE_URL);

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

const createCollection = async (user,id) => {
    fs.readFile('./clientCategorys/category.json', 'utf8', async (err, jsonData) => {
        if (err) {
            console.error('Error reading file:', err);
        }

        try {
            await mongoClient.connect();

            const database = mongoClient.db(process.env.DATABASE_NAME);
            const collections = await database.listCollections().toArray();

            const collectionExists = collections.some(col => col.name === `${user?.email.split("@")[0]}_client_category`);

            if (!collectionExists) {
                await database.createCollection(`${user?.email.split("@")[0]}_client_category`);
            }

            const userCategory = database.collection(`${user?.email.split("@")[0]}_client_category`);

            const clientCategory = {
                client_id: id,
                data: JSON.parse(jsonData)?.data
            }
            await userCategory.insertOne(clientCategory);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
        }
    });
}

module.exports = {
    hashPassword,
    comparePassword,
    compile,
    isValidEmail,
    createCollection
}