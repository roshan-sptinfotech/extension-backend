const nodemailer = require("nodemailer");

async function sendEmail(receiver, subject, htmlBody)
{
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_EMAIL_PASSWORD
        }
    });


    const options = {
        from: process.env.ADMIN_EMAIL,
        to: receiver,
        subject,
        html: htmlBody
    };


    return new Promise((resolve, reject) => 
    {
        transporter.sendMail(options, (error, info) => 
        {
            if(error)
                reject(error);

            resolve(info);
        });
    });
}

module.exports = sendEmail;