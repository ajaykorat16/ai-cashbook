const Users = require("../models/userModel");
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const { promisify } = require('util');
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer")
const { hashPassword, comparePassword, compile } = require("../helpers/helper");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_AUTH_USER,
        pass: process.env.MAIL_AUTH_PASS,
    },
});

const sendMailAsync = promisify(transporter.sendMail).bind(transporter);

const createUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { first_name, last_name, email, phone } = req.body;

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

        const token = crypto.randomBytes(16).toString('hex');

        const newUser = await new Users({
            first_name,
            last_name,
            email,
            phone,
            token
        }).save();

        if (newUser) {
            const data = {
                first_name,
                comapany_name: process.env.COMPANY_NAME,
                company_email: process.env.COMPANY_EMAIL,
                verification_link: `${process.env.CLIENT_SIDE_URL}/reset-password/${token}`
            }

            let content = compile(data, "./templates/emailVerification.html")

            const mailOptions = {
                from: process.env.ADMIN_EMAIL,
                to: email,
                subject: 'Verify your email address for account registration',
                html: content
            };

            const mailResponse = await sendMailAsync(mailOptions);

            if (mailResponse?.accepted) {
                return res.status(200).send({
                    error: false,
                    message: "Your Contact details submitted successfully. Thank you for sharing this with us!",
                    user: newUser,
                });
            } else {
                return res.status(500).send({
                    error: true,
                    message: "Some error occured",
                });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server error");
    }
}


const forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, errors: errors.array() });
    }
    try {
        const { email } = req.body;

        const [user] = await Users.find({ email });
        if (!user) {
            return res.status(200).json({
                error: true,
                message: "Please sign up first.",
            });
        }

        const token = crypto.randomBytes(16).toString('hex');

        const updatedUser = await Users.findByIdAndUpdate(user?.id, { token }, { new: true });
        if (updatedUser) {
            const data = {
                first_name: user?.first_name,
                comapany_name: process.env.COMPANY_NAME,
                company_email: process.env.COMPANY_EMAIL,
                reset_link: `${process.env.CLIENT_SIDE_URL}/reset-password/${token}`
            }

            let content = compile(data, "./templates/resetPassword.html")

            const mailOptions = {
                from: process.env.ADMIN_EMAIL,
                to: email,
                subject: 'Reset Password',
                html: content
            };

            const mailResponse = await sendMailAsync(mailOptions);

            if (mailResponse?.accepted) {
                return res.status(200).send({
                    error: false,
                    message: "Please check your email. A reset link has been sent successfully.",
                    user: updatedUser,
                });
            } else {
                return res.status(500).send({
                    error: true,
                    message: "Some error occured",
                });
            }
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Server error");
    }
}

const verifyUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, errors: errors.array() });
    }
    try {
        const { token } = req.params
        const { password } = req.body;

        const [user] = await Users.find({ token });
        if (!user) {
            return res.status(200).json({
                error: true,
                message: "Token expired.",
            });
        }

        const hashedPassword = await hashPassword(password);

        const userDetails = {
            password: hashedPassword,
            verified: true,
            token: ""
        }

        await Users.findByIdAndUpdate(user?.id, userDetails);

        return res.status(200).send({
            error: false,
            message: "Email verification successfully.",
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Server error");
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

        if (!user?.verified) {
            return res.status(200).json({
                error: true,
                message: "Please verify your email.",
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
            return res.status(400).send({
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
            return res.status(400).send({
                error: true,
                message: "You are already signed up. Please log in."
            });
        } else {
            const userDetails = {
                first_name,
                last_name,
                email,
                verified: true
            }
            const newUser = await new Users(userDetails).save();
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

module.exports = { createUser, verifyUser, forgotPassword, loginUser, loginUserByGoogle, signUpUserByGoogle }