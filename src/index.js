
//=====================Importing Module and Packages=====================//
const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const multer = require('multer');
const route = require("./routes/route");
const app = express();


app.use(bodyParser.json())
app.use(multer().any());

mongoose.connect("mongodb+srv://syguru82sun:Roll123@cluster0.btfeueg.mongodb.net/guru123",
    {
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("MongoDb is connected"))
  .catch((err) => console.log(err));

app.use("/", route);

app.use(function (req, res) {
  var err = new Error("Not Found.");
  err.status = 404;
  return res.status(404).send({ status: "404", msg: "Path not Found." });
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Express app running on port " + (process.env.PORT || 3000));
});
