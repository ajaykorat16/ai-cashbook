const express = require('express')
const { check } = require('express-validator');

const { createUser, loginUser, loginUserByGoogle, signUpUserByGoogle } = require('../controllers/users')
const router = express.Router()


router.post("/register",
    check('first_name', 'Firstname is required.').notEmpty(),
    check('last_name', 'Lastname is required.').notEmpty(),
    check('email', 'Please include a valid email.').isEmail(),
    check('password', 'Please enter a password with 8 or more characters.').isLength({ min: 8 }),
    check('phone', 'Please enter valid phone number.').isLength({ min: 10, max: 13 }),
    createUser
)

router.post("/login",
    check('email', 'Email is required.').isEmail(),
    check('password', 'Password is required.').notEmpty(),
    loginUser
)

router.post("/loginByGoogle",
    check('email', 'Email is required.').isEmail(),
    loginUserByGoogle
)

router.post("/signUpByGoogle",
    check('first_name', 'Firstname is required.').notEmpty(),
    check('last_name', 'Lastname is required.').notEmpty(),
    check('email', 'Please include a valid email.').isEmail(),
    signUpUserByGoogle
)


module.exports = router