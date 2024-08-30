require('dotenv').config()
require('./config/db.js')
const express = require('express')
const cors = require('cors')
const PORT = 8080 || process.env.PORT

const user = require('./routers/users.js')
const client = require('./routers/client.js')

const app = express()
app.use(cors())
app.use(express.json())

//routes
app.use('/user', user)
app.use('/client', client)


app.listen(PORT, () => {
    console.log(`Your url is http://localhost:${PORT}`)
})