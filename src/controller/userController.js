const userModel = require('../model/userModel.js')

var jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { uploadFile } = require("../aws/aws.js")



//===============================Validation for User==============================
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

// ================================== Create User ===========================
const createUser = async function (req, res) {

    try {

        let data = req.body;

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Please enter Data" })
        }

        let { name, email, profileImage, password, phone } = data;

        // ================================== Name =================================
        if (!name) {
            return res.status(400).send({ status: false, message: "Please enter your fistName" })
        }
        if (!/^[a-z ,.'-]+$/i.test(name)) {
            return res.status(400).send({ status: false, message: "fname should be in alphabate", });
        }
    

        // ================================== Email  ===============================
        if (!email) {
            return res.status(400).send({ status: false, message: "Please enter email" })
        };
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email entered is of Invalid Type" });
        }
        if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email.trim())) {
            return res.status(400).send({ status: false, message: "Email is invalid format" });
        };
        const duplicateEmail = await userModel.findOne({ email: email })

        if (duplicateEmail) {
            return res.status(400).send({ status: false, message: "Email Already  Exist" })
        }

        // ==================================  Phone Number ===============================
        if (!phone) {
            return res.status(400).send({ status: false, message: "Please enter phone number" })
        }
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Phone is Empty" })
        }
        if (!/^[789]\d{9}$/.test(phone.trim())) {
            return res.status(400).send({ status: false, message: "phone number should be valid number. Should atrt with 8 or 7 or 9 and total of 10 digits" })
        }
        const duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) {
            return res.status(400).send({ status: false, message: "Phone Already Exist" })
        }

        // ================================== Password  ===============================
        if (!password) {
            return res.status(400).send({ status: false, message: "Please enter password" })
        }
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Password is Empty" })
        }
        if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password.trim())) {
            return res.status(400).send({ status: false, message: " Please Enter minLen 8, maxLen 15 (please provide e.g-> suraj@1234). Also It should have aleast One capital Letter, special character, digit and small letter" })
        }


        // =================================== Create  ProfileImage link by AWS =======================
        let files = req.files
        let profile = files[0].originalname;

        if (!(/\.(jpe?g|png|webp|jpg)$/i).test(profile)) {
            return res.status(400).send({ status: false, message: " Please provide only image  of format only-> jpe?g|png|webp|jpg" })
        }

        if (!(files && files.length > 0)) {
            return res.status(400).send({ status: false, message: "Please Provide The Profile Image" });
        }

        const uploadedProfileImage = await uploadFile(files[0])
        data.profileImage = uploadedProfileImage

        const userData = await userModel.create(data)
        return res.status(201).send({ status: true, message: "User created successfully", data: userData })

    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }


}



// =================================================== login User ===========================================

const loginUser = async function (req, res) {
    try {

        let credential = req.body;

        if (Object.keys(credential).length == 0) {
            return res.status(400).send({ status: false, message: "Please Provide Crendential" })
        }
        let { email, password } = credential;

        if (!email) {
            return res.status(400).send({ status: false, message: "EmailId is mandatory" })
        }

        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "email is should be in string format" })
        }

        if (!password) {
            return res.status(400).send({ status: false, message: "Password is mandatory" })
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "password is should be in string format" })
        }


        let userEmail = await userModel.findOne({ email: email })
        if (!userEmail) {
            return res.status(401).send({ status: false, message: "Invalid Crendential , Correct Credential provide correct Email " })
        }
        console.log(userEmail)
        if (userEmail.password != password) {
            return res.status(401).send({ status: false, message: "Invalid Crendential " })
        }

        let token = jwt.sign(
            {
                userId: userEmail._id.toString(),
                iat: Math.floor(Date.now() / 1000)
            },
            "Products Management", {

            expiresIn: '10h' // expires in 10h

        });

        let data = {
            userId: userEmail._id.toString(),
            token: token

        }
        return res.status(201).send({ status: true, message: "User login successfull", data: data })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }

}
//===========================================Get Users==============================================================
const getUsers = async function (req, res) {
    try {
        let data = req.params.userId
        if (!data) {
            return res.status(400).send({ status: false, msg: "userId not present" })
        }
        if (!mongoose.isValidObjectId(data)) {
            return res.status(400).send({ status: false, message: " invalid userId length" })
        }
        let allUsers = await userModel.findById({ _id: data })
        if (!allUsers) {
            return res.status(404).send({ status: false, message: "user not found" })
        } else {
            return res.status(200).send({ status: true, message: "User profile details", data: allUsers })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }


}



//================================= ======Update USer API======================
const updateUser = async function (req, res) {
    try {

        let data = req.body;
        let userId = req.params.userId
        let files = req.files
        let { name, email, phone, password } = data;

        // ======validation of Objectid in params==============
        if (!isValid(req.params.userId)) {
            return res.status(400).send({ status: false, msg: 'enter a valid objectId in params' })
        }

        // ======checking body is empty or not======================
        if (Object.keys(req.body).length == 0 && !files) {
            return res.status(400).send({ status: false, msg: "Enter valid data to update" });
        }



        // ====== validation of fname ================
        if (name) {
            if (!isValid(name)) return res.status(400).send({ status: false, msg: "first Name is not valid" });
        }

        // ======valiation of email================================
        if (email) {
            if (!isValid(email)) return res.status(400).send({ status: false, msg: "email Id is not valid" });

            email = email.trim()
            if (!/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email))
                return res.status(400).send({ status: false, msg: "email ID is not valid" });

            let dupEmail = await userModel.findOne({ email: email });
            if (dupEmail) return res.status(400).send({ status: false, msg: "email is already registered" });
        }

        // ================================ valiation of phone================================
        if (phone) {

            if (!/^[789]\d{9}$/.test(phone.trim())) return res.status(400).send({ status: false, message: "phone number should be valid number Should atrt with 8 or 7 or 9 and total of 10 digits", });

            let dupPhone = await userModel.findOne({ phone: phone });
            if (dupPhone) return res.status(400).send({ status: false, msg: "phone is already registered" });

        }

        // ==================================valiation of password================================
        if (password) {
            if (password.length < 8 || password.length > 15) return res.status(400).send({ status: false, msg: "Password length should be 8 to 15" });
            if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password.trim())) {
                return res.status(400).send({ status: false, message: " Please Enter minLen 8, maxLen 15 (please provide e.g-> suraj@1234). Also It should have aleast One capital Letter, special character, digit and small letter" })
            }
            let user = await userModel.findById(userId);
            // check if passsword is same as previous one 
            if (user.password == password) return res.status(400).send({ status: false, msg: "password is same as the last one, try another password or login again" });
            
        }

        
        //======================================valiation of profileImage ================================

        if (files.length > 0) {

            let profile = files[0].originalname;

            if (!(/\.(jpe?g|png|webp|jpg)$/i).test(profile)) {
                return res.status(400).send({ status: false, message: " Please provide only image  of format only-> jpe?g|png|webp|jpg" })
            }

            if (!(files && files.length > 0)) {
                return res.status(400).send({ status: false, message: "Please Provide The Profile Image" });
            }

            var uploadedProfileImage = await uploadFile(files[0])
            data.profileImage = uploadedProfileImage
        }


        //======================================= Update The data===============
        let updatedUser = await userModel.findOneAndUpdate({ _id: userId }, {
            $set: {
                name: name, email: email, phone: phone, password: password, profileImage: uploadedProfileImage}}, { new: true })

        return res.status(200).send({ status: true, message: "User profile updated", data: updatedUser })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }
}
// DeStructuring
module.exports = { createUser, loginUser, getUsers, updateUser };
