const express = require('express')
const { check } = require('express-validator');
const { auth } = require("../middleware/auth")

const { createUser, verifyUser, forgotPassword, loginUser, loginUserByGoogle, signUpUserByGoogle } = require('../controllers/users')
const router = express.Router()


router.post("/register",
    check('first_name', 'Firstname is required.').notEmpty(),
    check('last_name', 'Lastname is required.').notEmpty(),
    check('email', 'Please include a valid email.').isEmail(),
    check('phone', 'Please enter valid phone number.').isLength({ min: 10, max: 13 }),
    createUser
)

router.put("/verify-user/:token",
    check('password', 'Password is required').notEmpty(),
    check('password', 'Please enter a password with 8 or more characters.').isLength({ min: 8 }),
    verifyUser
)

router.put("/forgot-password",
    check('email', 'Please include a valid email.').isEmail(),
    forgotPassword
)

router.post("/login",
    check('email', 'Email is required.').isEmail(),
    check('password', 'Password is required.').notEmpty(),
    loginUser
)

router.post("/login-by-google",
    check('email', 'Email is required.').isEmail(),
    loginUserByGoogle
)

router.post("/signup-by-google",
    check('first_name', 'Firstname is required.').notEmpty(),
    check('last_name', 'Lastname is required.').notEmpty(),
    check('email', 'Please include a valid email.').isEmail(),
    signUpUserByGoogle
)

router.get('/user-auth', auth, (req, res) => {
    res.status(200).json({ ok: true })
})


module.exports = router