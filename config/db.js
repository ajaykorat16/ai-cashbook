const mongoose = require('mongoose')

const connectDb = async () => {
    try {

        const conn = await mongoose.connect(process.env.DATABASE_URL)
        console.log(`Database connected successfully.`)

    } catch (error) {
        console.log(`Error in Mongodb ${error}`)
    }
}

module.exports = connectDb;