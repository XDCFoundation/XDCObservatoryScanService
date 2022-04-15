import Config from ".";
import mongoose from "mongoose";
const fs = require("fs");

export default class DBConnection {
  static connect() {
    console.log(
      "DB trying to connect on " + new Date() + " to url" + Config.DB
    );
    const caContent = [
      fs.readFileSync(__dirname  +"/"+Config.RDS_FILE),
    ];

    const options = {
      keepAlive: 1,
      autoReconnect: true,
      poolSize: 10,
      ssl: true,
      sslValidate: false,
      sslCA: caContent,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    };
    return mongoose.connect(Config.DB, options);
  }
}
