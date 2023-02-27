const express = require("express");
const router = express.Router();
const urlController = require("../controller/urlShorter");
const userController = require("../controller/userController")
const MW = require("../middleware/middleware.js")

//=========testApi=========
router.get("/test", function (req, res) {
  res.send("Hello Work");
});

//shortUrl API
router.post("/url/shorten", urlController.urlShort);

//Using Cache
router.get("/:urlCode", urlController.getUrlByParam);


// =================================== Create User ============================
router.post("/register", userController.createUser)
router.post("/login", userController.loginUser)
router.get("/user/:userId/profile", MW.authentication, userController.getUsers)
router.put("/user/:userId/profile", MW.authentication, MW.authorization, userController.updateUser)


module.exports = router;
