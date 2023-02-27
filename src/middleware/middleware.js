const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const userModel = require('../model/userModel.js')


//--------------------------|| AUTHENTICATION ||--------------------------------

const authentication = async function (req, res, next) {
  try {
    let token = req.headers["Authorization"] || req.headers["authorization"];

    if (!token) {
      return res.status(400).send({ status: false, message: "Token is Required" })
    }

    let Bearer = token.split(' ');

    let decodedToken = jwt.verify(Bearer[0], "Products Management", (error) => {
      if (error) {
        return res.status(400).send({ status: false, message: "Token is not correct!" })
      }

      next();

    });



  } catch (error) {
    console.log(error)
    res.status(500).send({ status: false, message: error.message })
  }
}

//--------------------------|| AUTHORIZATION ||--------------------------------


const authorization = async function (req, res, next) {
  try {
    let token = req.headers["Authorization"] || req.headers["authorization"]; // we call headers with name x-api-key

    if (!token) {
      res.status(401).send({ status: false, msg: "missing a mandatory token" })
    };
    let Bearer = token.split(' ');

    let decodedToken = jwt.verify(Bearer[0], "Products Management")
    let userLoggedIn = decodedToken.userId;


    let userId = req.params.userId

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).send({ status: false, msg: 'Please enter valid userId Id' })
    }
    let userData = await userModel.findById(userId)
    if (!userData) {
      return res.status(404).send({ status: false, messsage: "UserId not found " })
    }
    let user = userData._id.toString();

    if (userLoggedIn != user) {
      return res.status(403).send({ status: false, msg: "You are not authrized" });
    }
    next();
  } catch (error) {
    console.log(error)
    res.status(500).send({ status: false, Error: error.message });
  }
};

// DeStructuring
module.exports = { authentication, authorization }
