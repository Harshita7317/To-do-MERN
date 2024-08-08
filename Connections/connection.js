const mongoose = require("mongoose");
const connectDatabase = async () => {
  try {
    mongoose.connect(`${process.env.MONGO_URI}`).then(() => {
      console.log("Connected to MongoDB");
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports = { connectDatabase };
