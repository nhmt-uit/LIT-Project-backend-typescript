const nodeMailer = require('nodemailer')

// Setup mail account 
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

// Set portmail && hostmail 
const mailHost = 'smtp.gmail.com'
const mailPort = 587

const sendMail = (to: any, subject: any, htmlContent: any) => {
    const transporter = nodeMailer.createTransport({
        host: mailHost,
        port: mailPort,
        secure: false,
        auth: {
            user: adminEmail,
            pass: adminPassword
        }
    })
    const options = {
        from: adminEmail, // Your email address
        to: to, // To email address
        subject: subject,
        html: htmlContent
    }

    return transporter.sendMail(options)
}

export default { sendMail }