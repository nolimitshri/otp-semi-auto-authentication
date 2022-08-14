require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use("/api", require("./router/adduser.routes"));

mongoose.connect("mongodb://localhost:27017/otp_ewaste_trial_DB", {useNewUrlParser: true})
.then(() => console.log('Mongoose Connected !'))
.catch(e => console.log('Some Error while Mongoose Conn !!'));

app.listen(3000, () => {console.log('Server started @ PORT: 3000')});