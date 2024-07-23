const express = require('express')
const app = express()
const dotenv = require('dotenv')
const connectDb = require('./config/db.js')
const cors = require('cors')
const PORT = 8080 || process.env.PORT


dotenv.config()

app.use(cors())
app.use(express.json())

connectDb()

const user = require('./routers/users.js')

//routes
app.use('/user', user)


app.listen(PORT, () => {
    console.log(`Your url is http://localhost:${PORT}`)
})