const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Database connected successfully.')).catch((error) => console.log(`error : ${error.message}`));