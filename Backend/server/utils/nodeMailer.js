const nodemailer = require("nodemailer");
require('dotenv').config()
const sendEmail = async (to, template) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"AirWrite" <${process.env.EMAIL}>`,
    to:to,
    subject: template.subject,
    html: template.html,
  });
};



module.exports = sendEmail