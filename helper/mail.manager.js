/**
 * Mail Manager

 * @export {Class}
 * @author KL-Kim (github.com/KL-Kim)
 * @version 0.0.1
 * @license MIT
 */

import Promise from 'bluebird';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

import config from '../config/config';
import BaseAutobind from './base-autobind.js';

class MailManager extends BaseAutobind {
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

  /**
   * MailManager Health check
   * @returns *
   */
  sendTest() {
    const subject = 'Hello, world';
    const html = '<b>Hello, world from iKoreaTown</b>';

    const mailOptions = {
      from: '"iKoreatown Team" <ikoreatown@hotmail.com>',
      to: 'jinguanglong11@hotmail.com',
      subject: subject,
      html: html
    };

    this._transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
          return console.log(err);
      }
      console.log('Message sent: %s', info.messageId);
    });
  }

  /**
   * Send Account Verification Email
   * @param {Object} user - User
   * @param {string} token - Token to send with email
   * @returns {Promise<string, APIError>}
   */
  sendEmailVerification(user, token) {
    return new Promise((resolve, reject) => {
      const ejsVar = {
        username: user.username,
        url: config.webService.accountVerifyUrl + token,
      };

      ejs.renderFile(path.resolve(__dirname, '../templates/email/verification.ejs'), ejsVar, (err, data) => {
        if (err) return console.log(err);

        const subject = "Welcome to iKoreaTown";
        const mailOptions = {
          from: '"iKoreatown Team" <ikoreatown@hotmail.com>',
          to: user.email,
          subject: subject,
          html: data,
        };

        this._transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            return reject(err);
          }

          if (info) {
            return resolve(info.response);
          }

          // console.log('Message sent: %s', info.messageId);
        });
      });
    });
  }

  /**
   * Send Change password Email
   * @param {Object} user - User
   * @param {string} token - Token to send with email
   * @returns {Promise<string, APIError>}
   */
  sendChangePassword(user, token) {
    return new Promise((resolve, reject) => {
      const ejsVar = {
        username: user.username,
        url: config.webService.changePasswordUrl + token,
      };

      ejs.renderFile(path.resolve(__dirname, '../templates/email/change-password.ejs'), ejsVar, (err, data) => {
        if (err) return console.log(err);

        const subject = "Change the Password";
        const mailOptions = {
          from: '"iKoreatown Team" <ikoreatown@hotmail.com>',
          to: user.email,
          subject: subject,
          html: data,
        };

        this._transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            return reject(err);
          }

          if (info) {
            return resolve(info.response);
          }

          // console.log('Message sent: %s', info.messageId);
        });
      });
    });
  }
}

export default MailManager;
