const Users = require("../models/userModel");
const { validationResult } = require("express-validator");
const { hashPassword, comparePassword } = require("../helpers/helper");
const jwt = require("jsonwebtoken");


const createUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { first_name, last_name, email, password, phone } = req.body;

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(200).json({
                error: true,
                message: "User already register with this email.",
            });
        }

        const existingPhone = await Users.findOne({ phone });
        if (existingPhone) {
            return res.status(200).json({
                error: true,
                message: "Phone Number should be unique.",
            });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await new Users({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            phone,
        }).save();

        return res.status(201).json({
            error: false,
            message: "User created successfully.",
            user: newUser,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server error");
    }
}


const loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, errors: errors.array() });
    }
    try {
        const { email, password } = req.body;

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(200).json({
                error: true,
                message: "Please sign up first.",
            });
        }

        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.status(200).json({
                error: true,
                message: "Invalid crendentials.",
            });
        }

        const token = await jwt.sign({ user }, process.env.JWT_SECRET_KEY, { expiresIn: "365 days", });
        return res.status(200).send({
            error: false,
            message: "Login successfully !",
            user,
            token,
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Server error");
    }
}

const loginUserByGoogle = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, errors: errors.array() });
    }
    try {
        const { email } = req.body;

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            const token = await jwt.sign({ user: existingUser }, process.env.JWT_SECRET_KEY, { expiresIn: "365 days", });
            return res.status(200).send({
                error: false,
                message: "Login successfully !",
                user: existingUser,
                token,
            });
        } else {
            return res.status(200).send({
                error: true,
                message: "You are not signed up. Please sign up.",
            });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Server error");
    }
}


const signUpUserByGoogle = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, errors: errors.array() });
    }
    try {
        const { email, first_name, last_name } = req.body;

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(200).send({
                error: true,
                message: "You are already signed up. Please log in."
            });
        } else {
            const newUser = await new Users({ first_name, last_name, email }).save();
            const token = await jwt.sign({ user: newUser }, process.env.JWT_SECRET_KEY, { expiresIn: "365 days", });

            return res.status(200).send({
                error: false,
                message: "Sign Up successfully !",
                user: newUser,
                token,
            });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Server error");
    }
}

module.exports = { createUser, loginUser, loginUserByGoogle, signUpUserByGoogle }