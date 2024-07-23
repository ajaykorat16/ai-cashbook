const mongoose = require('mongoose')

const connectDb = async () => {
    try {

        const conn = await mongoose.connect(process.env.DATABASE_URL)
        console.log(`Connection Succesful to mongoDb`)

    } catch (error) {
        console.log(`Error in Mongodb ${error}`)
    }
}

module.exports = connectDb;