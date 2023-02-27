const shortid = require("shortid");
const valiUrl = require("valid-url");
const { promisify } = require('util');
const Redis = require("ioredis");

// =======================
let client = new Redis({
  port: 13798, // Redis port
  host: "redis-13798.c301.ap-south-1-1.ec2.cloud.redislabs.com", // Redis host
  password: "zz689OEtAwaaKPcVsjp5MSPsru0bmemj",
  db: 0, // Defaults to 0
});

client.on("connect", function () {
  console.log("Redis client connected");
});

const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);


// ===================

//reuiring model
const urlModel = require("../model/Urlmodel");

// URL Shortner
exports.urlShort = async function (req, res) {
  try {
    //Not Accepting Empty req

    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, msg: "Request Cant be empty" });
    }

    //
    if (!req.body.longUrl) {
      return res.status(400).send({
        status: false,
        msg: "Key Should be longUrl!",
      });
    }

    //Accepting link in String Format
    if (typeof req.body.longUrl != "string") {
      return res.status(400).send({
        status: false,
        msg: "LongURL can be in a String only!",
      });
    }

    //Orignal Link

    //regex for links
    let checkUrl =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%\+.~#?&\/\/=]*)/.test(
        req.body.longUrl
      );

    //Checking Url (valid?/Not)

    if (checkUrl == false) {
      return res
        .status(400)
        .send({ status: false, msg: "Link is not in valid formate" });
    }

    //Checking baseUrl (Valid?/Not)
    if (!valiUrl.isUri(req.body.longUrl)) {
      return res
        .status(400)
        .send({ status: false, msg: "Url is Not Valid URL " });
    }

    //handling Dublication(bcz if this link is already present in Our Db We have to send him/her Same Shorterner)
    let duplicateUrl = await urlModel
      .findOne({ longUrl: req.body.longUrl })
      .select({ _id: 0, __v: 0 });

    //if not Found then Create that url in Collection
    if (duplicateUrl == null) {
      //genrating shortUrl
      let shortUrl = shortid.generate(req.body).toLowerCase();

      let baseUrl = "http://localhost:3000/" + shortUrl;

      //Creating
      let urlStore = await urlModel.create({
        longUrl: req.body.longUrl,
        urlCode: shortUrl,
        shortUrl: baseUrl,
      });

      return res.status(201).send({
        status: true,
        data: {
          longUrl: urlStore.longUrl,
          shortUrl: urlStore.shortUrl,
          urlCode: urlStore.urlCode,
        },
      });
    }

    //Finding in Cache
    let cacheUrlInMemory = await GET_ASYNC(duplicateUrl.urlCode);

    //If(Not Found in Cache Memory)
    if (cacheUrlInMemory == null) {
      // Seting in Cash Storage
      await SET_ASYNC(duplicateUrl.urlCode, JSON.stringify(duplicateUrl));

      return res.status(200).send({
        status: true,
        msg: " this Url is already Present In Db ",
        data: duplicateUrl,
      });
    } else {
      return res.status(200).send({
        status: true,
        msg: "this Url is already Present( Comming From Cache Memory) ",
        data: JSON.parse(cacheUrlInMemory),
      });
    }

  } catch (err) {
    res
      .status(500)
      .send({ status: false, msg: "Server Error!!", err: err.message });
  }
};

//get API
exports.getUrlByParam = async function (req, res) {
  try {
    //================Get URLCODE=========================
    let urlCode = req.params.urlCode;

    //================Short Id Verification// npm i shortid=========================
    if (!shortid.isValid(urlCode))
      return res.status(400).send({ status: false, message: "Invalid Code" });
    if (!/^[a-zA-Z0-9_-]{7,14}$/.test(urlCode))
      return res.status(400).send({
        status: false,
        message:
          "Enter UrlCode with a-z A-Z 0-9 -_ and of length 7-14 characters",
      });

    // ======================= Get Data From cache====
    let cahcedUrl = await GET_ASYNC(urlCode.toLowerCase()); //---get the urlCode from cache

    if (cahcedUrl) {

      return res.status(200).send({ status:true, message: cahcedUrl });
    } else {
      let findUrl = await urlModel.findOne({ urlCode: urlCode });
      if (!findUrl)
        return res.status(404).send({ status: false, message: "No URL found" });

      //=============Set data in cache===============================
      await SET_ASYNC(urlCode, findUrl.longUrl);
      //================Rediecting To Original URL=========================
      return res.status(302).redirect(findUrl.longUrl);
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
