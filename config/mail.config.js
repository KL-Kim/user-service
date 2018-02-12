import nodemailer from 'nodemailer';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

import config from './config';
import BaseAutobind from '../helper/base-autobind.js';

class Mail extends BaseAutobind {
  constructor() {
    super();

    this._transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: config.mailAccount.user,
        pass: config.mailAccount.pass,
      }
    });
  }

  sendTest() {
    const subject = 'Hello, world';
    const html = '<b>Hello, world from iKoreaTown</b>';

    const mailOptions = {
      from: '"iKoreatown Team" <ikoreatown@hotmail.com>',
      to: 'jinguanglong11@hotmail.com',
      subject: subject,
      html: html
    };

    this._transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
    });
  }

  sendEmailVerification(email) {
    ejs.renderFile(path.resolve(__dirname, '../templates/email/verification.ejs'),
      {

        username: 'tony',
        url: 'https://www.google.com'
      },
      (err, data) => {
        if (err) return console.log(err);

        const subject = "Welcome to iKoreaTown";
        const mailOptions = {
          from: '"iKoreatown Team" <ikoreatown@hotmail.com>',
          to: email,
          subject: subject,
          html: data,
        };

        this._transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              return console.log(error);
          }
          console.log('Message sent: %s', info.messageId);

        });
      }
    );
  }
}

let email = new Mail();

email.sendEmailVerification('jinguanglong11@hotmail.com');
