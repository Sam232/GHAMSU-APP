const mongoose = require("mongoose");

module.exports = {
  mongooseConnect: () => {
    if(process.env.NODE_ENV == "production"){
      return mongoose.connect("").then((res) => {
        if(res){
          console.log("Connected To Production MongoDB Database Server");
        }
      })
      .catch((err) => {
        if(err){
          console.log("Error Connecting To Production MongoDB Database Server");
        }
      });
    }

    mongoose.connect("mongodb://localhost:27017/ghamsu").then((res) => {
        if(res){
          console.log("Connected To Local MongoDB Database Server");
        }
      })
      .catch((err) => {
        if(err){
          console.log("Error Connecting To Local MongoDB Database Server");
        }
      });
  }
}
