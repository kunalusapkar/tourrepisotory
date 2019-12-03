/* eslint-disable */
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split('')[0];
        this.url = url;
        this.from = `Kunal Usapkar <${process.env.EMAIL_FROM}>`;
    }
    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return 1;
        } else {
            // return nodemailer.createTransport({
            //     host: "smtp.mailtrap.io",
            //     port: 25,
            //     auth: {
            //         user: "70404374e8abef",
            //         pass: "04bbef3f8ede5f"
            //     }
            // });
            return nodemailer.createTransport({
                service: "SendGrid",
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
        }
    }
    async send(template, subject) {
        // Render HTML template
        const html = pug.renderFile(`${__dirname}/../views/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });
        // Define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),

        };

        // Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
        // await transporter.sendMail(mailOptions)

    }
    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Nators Family !');
    }
    async sendPasswordReset() {
        await this.send('passwordReset', 'Yor password token valid for 10 minutes');
    }
};



// module.exports = sendEmail;