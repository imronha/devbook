// Connection logic

const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

// Connect to mongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    // Log error message and exit with failure
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
