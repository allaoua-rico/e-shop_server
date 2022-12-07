const nodemailer = require("nodemailer");
const catchAsync = require("./catchAsync");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    // this.firstName=user.name.split('')[0]
    this.url = url;
    this.from = `Allaoua BOUDRIOU <${process.env.EMAIL_FROM}>`;
  }
  newTransport() {
    // if (process.env.NODE_ENV === "production") {
    // }
    return nodemailer.createTransport({
      // host: process.env.EMAIL_HOST,
      service:'Gmail',
      port: 25,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  async send(subject) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: this.url,
    };
    await this.newTransport().sendMail(mailOptions);
    console.log("Email sent sucessfully");
  }
  async sendPasswordReset() {
    await this.send("Your password reset token (valid for only 10 minutes)");
  }
};

// const sendEmail = catchAsync(async (email, subject, text) => {
//   // The transporter is the service that will send the email, here Gmail
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: 25,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: subject,
//     text: text,
//   };

//   await transporter.sendMail(mailOptions);
//   console.log("Email sent sucessfully");
// });

// module.exports = sendEmail;
