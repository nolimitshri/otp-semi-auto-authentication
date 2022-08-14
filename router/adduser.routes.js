const express = require('express');
const router = express.Router();
const moment = require("moment");
const otpGenerator = require('otp-generator');
const schedule = require("node-schedule"); 
const mailer = require("./mailer");
const bcryptjs = require('bcryptjs');

const userModel = require("../models/userModel");
const tokens = require("../models/tokens");

schedule.scheduleJob("* * * * *", async() => {
    const date = new Date();
    try{
        const otps = await tokens.find({});
        for(let i = 0; i < otps.length; i++){
            console.log('hello');
            if(date.getTime() > otps[i].expireAt){
                console.log('gotcha!!');
                console.log('The Token is Expired for User with ID: ' + otps[i].userId);
                const deleteToken = await tokens.findOneAndDelete({_id: otps[i]._id});
                const user = await userModel.findOne({_id: otps[i].userId});
                if(user){
                    const deleteUser = await userModel.findOneAndDelete({_id: user._id});
                    console.log(deleteUser);
                }
                console.log(deleteToken);
            }
        }
    }catch(e){
        console.log(e);
    }
});

router.get("/addUser", (req, res) => {
    // console.log(moment().format());
    // console.log(req.headers.host);
    res.render("index");
});

router.post("/addUser", async(req, res) => {
    const {email} = req.body;
    try{
        const user = await userModel.findOne({email});
        if(user) {
            if(user.isUpdated){
                console.log('user already exists, pls login !!');
                res.redirect('/api/login');
                return -1;
            } else {
                console.log('please update your details !!');
                res.redirect('/api/updateDetails/' + String(user._id));
                return -1;
            }
        }

        const newUser = new userModel({
            email,
        });
        const saveUser = await newUser.save();
        
        const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

        const token = await tokens.findOne({userId: saveUser._id});

        const expireTime = saveUser.createdAt.getTime() + 60000;
        // const expireTime = saveUser.createdAt.getTime() + 3600000;

        if(!token){
            const newToken = new tokens({
                userId: saveUser._id,
                token: otp,
                expireAt: expireTime 
            });

            const url = `http://${req.headers.host}/api/auth-with-otp/${saveUser._id}`
            const url1 = `http://${req.headers.host}/api/updateDetails/${saveUser._id}`

            const saveToken = await newToken.save();
            mailer.sendAnEmail(saveUser.email, saveToken.token, url, url1);
            console.log('Mail sent !!');
        }   
        const id = saveUser._id.toString();

        res.redirect(`/api/auth-with-otp/${id}`);

    }catch(e){
        console.log(e);
    }
});

router.get("/auth-with-otp/:id", async(req, res) => {
    const userId = req.params.id;
    try{
        const user = await userModel.findOne({_id: userId});
        if(user){
            if(user.isVerified){
                console.log("user already verified !!");
                res.redirect('/api/login');
            } else {
                res.render("otp_page", {email: user.email});
            }
        } else {
            console.log("no user found with id: " + userId);
            res.redirect('/api/addUser');
        }
    }catch(e){
        console.log(e);
    }
})

router.post("/auth-with-otp", async(req, res) => {
    const {email, otp} = req.body;
    console.log(email, otp);
    try{
        const date = new Date();
        const user = await userModel.findOne({email});
        const token = await tokens.findOne({userId: user._id});
        if(user){
            if(token){
                if(token.expireAt >= date.getTime()){
                    console.log("OTP is still valid");
                    if(token.token === Number(otp)){
                        console.log("Success !! Please proceed further to complete your details !!!");
                        const updateUser = await userModel.findOneAndUpdate({_id: user._id}, {isVerified: true}, {new: true, runValidators: true});
                        const deleteToken = await tokens.findOneAndDelete({userId: user._id});
                        console.log('Token also deleted');
                        res.redirect(`/api/updateDetails/${String(user._id)}`);
                    } else {
                        console.log("OTP entered is wrong !! Please enter it again !!");
                        res.redirect(`/api/auth-with-otp/${user._id}`);
                    }
                } else {
                    console.log("OTP enterd is no longer valid !!");
                    const deleteToken = await tokens.findOneAndDelete({userId: user._id});
                    const deleteUser = await userModel.findOneAndDelete({_id: user._id});
                    res.redirect('/api/addUser');
                }
            } else {
                console.log('your token was deleted from DB, reason could be you were not able to enter OTP in time !!');
                const deleteToken = await tokens.findOneAndDelete({userId: user._id});
                const deleteUser = await userModel.findOneAndDelete({_id: user._id});
                res.redirect('/api/addUser');
            }
        } else {
            console.log('no user found with EMAIL: ' + email);
            res.redirect('/api/addUser');
        }

    }catch(e){
        console.log(e);
    }
});

router.get('/updateDetails/:id', async(req, res) => {
    const userId = req.params.id;
    try{
        const user = await userModel.findOne({_id: userId});
        if(user){
            if(user.isUpdated){
                console.log('Your profile is already updated !! Please login to see ur activity');
                res.redirect('/api/login');
                return -1;
            }
            if(user.isVerified){
                res.render('updateUser', {email: user.email});
                return -1;
            } else {
                console.log('you are not verified or your details is already being updated !!');
                return -1;
            }
        } else {
            console.log('no user found !!');
            res.redirect('/api/addUser');
        }
    }catch(e){
        console.log(e);
    }
});

router.post('/updateDetails', async(req, res) => {
    const {email, name, age, company, pwd1, pwd2} = req.body;
    try{
        const user = await userModel.findOne({email});
        if(user){
            await bcryptjs.genSalt(10, async(err, salt) => {
                await bcryptjs.hash(pwd1, salt, async(e, hashedPwd) => {
                    if(err || e) throw new Error(err, e);
                    const updateUser = await userModel.findOneAndUpdate({_id: user._id}, {name, age, company, isUpdated: true, password: hashedPwd}, {new: true, runValidators: true});
                    console.log('user updated !!');
                })
            })
            
            res.redirect('/api/login');
        } else {
            console.log('no user found !! Please register yourself !!');
            res.redirect('/api/addUser');
        }
    }catch(e){
        console.log(e);
    }
});

router.get("/allUsers", async(req, res) => {
    try{   
        const users = await userModel.find({});
        res.render('allUsers', {users});
    }catch(e){
        console.log(e);
    }
});

router.get('/login', (req, res) => {
    res.render('login');
})

router.post('/login', async(req, res) => {
    const {email, pwd} = req.body;
    try{
        const user = await userModel.findOne({email});
        if(user){
            bcryptjs.compare(pwd, user.password, (err, isMatch) => {
                if(err) throw err;
                if(isMatch){
                    console.log('Correct Password !!');
                    res.redirect(`/api/my-activity/${String(user._id)}`);
                } else {
                    console.log('wrong password !!');
                    res.redirect('/api/login');
                }
            })
        } else {
            console.log('no user found !');
            res.redirect('/api/addUser');
        }
    }catch(e){
        console.log(e);
    }
});

router.get('/my-activity/:id', async(req, res) => {
    const userId = req.params.id;
    try{
        const user = await userModel.findOne({_id: userId}, {password: 0});
        if(user){
            res.render('user', {user});
        } else {
            console.log('no user');
            res.redirect('/api/addUser');
        }
    }catch(e){
        console.log(e);
    }
});

module.exports = router;