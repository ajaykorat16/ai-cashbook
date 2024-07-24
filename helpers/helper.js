const bcrypt = require("bcrypt");
const saltRounds = 10;
const fs = require("fs")
const hbs = require("handlebars")

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

module.exports = {
    hashPassword,
    comparePassword,
    compile
}