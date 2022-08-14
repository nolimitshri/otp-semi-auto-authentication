const mailer = require("nodemailer");

const transporter = mailer.createTransport({
    service: "gmail",
    port: 465,
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD
    }
});

module.exports.sendAnEmail = async(email, otp, url, url1) => {

    await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Verify yourself - ZaKK Tech.",
        html: `
            <h1 style="text-align: center;">Thank You ${email} for visiting <span style="color: red;">ZaKK Tech.</span>.</h1>
            <p>Here is your OTP: <b style="text-decoration: underline; color: royalblue;">${otp}</b> to Verify yourself.</p>
            <p>Enter your OTP here: <a href='${url}'>OTP</a> </p>
            <p>In case you want to update your profile later. Here is the link:- <a href='${url1}'>Click Here</a></p>
            <p>This is valid only for 1 minute.</p>
        `
    }, (err, info) => {
        if(err){
            console.log(err);
        } else {
            console.log(info.response);
        }
    })
};