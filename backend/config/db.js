const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            'mongodb+srv://Umeed:Umeed%402025@umeed.iqfkz.mongodb.net/job_portal?retryWrites=true&w=majority&appName=Umeed'
        );
        console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
