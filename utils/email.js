const nodemailer = require('nodemailer');
const sendEmail = async (options) => {
    // create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        // secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME, // generated ethereal user
            pass: process.env.EMAIL_PASSWORD, // generated ethereal password
        }
       
    })
    // define the email options
    const mailOptions = { 
        from: 'Menuverse' ,
        to: options.email,
        subject: options.subject,
        text: options.message,
    }
    // send the email
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Email sending error:', err);
        throw err;
    }
}


module.exports = sendEmail;