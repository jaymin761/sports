const nodemailer = require('nodemailer')
const development = require('config')
const ejs = require('ejs')
import path from "path";
import axios from "axios";
import { AppStrings } from "../../utils/appStrings";

const sendMailOTP = (to: string, subject: string, message: string, otp: any) => {
    try {
        var smtpConfig = {
            host: "smtp.gmail.com",
            port: 465,
            secure: false, // use SSL
            auth: {
                user: development.MAIL_USER,
                pass: development.MAIL_PASSWORD
            }
        };

        var transporter = nodemailer.createTransport(smtpConfig);
        const url_path = path.join(__dirname, '/views/emailsend.ejs')
        ejs.renderFile(url_path, { otp: otp, message: message }, async function (err: any, data: any) {
            if (err) {
                console.log(err);
            } else {
                const mailOptions = {
                    from: development.MAIL_USER,
                    to: to,
                    subject: subject,
                    html: data
                };

                await transporter.sendMail(mailOptions, function (error: any, info: any) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
        })
    } catch (error: any) {
        console.log(error.message);
    }

};

const verifyMail = async (to: string, subject: string, text_body: string, sender: string, otp: any, message: string, fullName: any) => {
    const url_path = path.join(__dirname, '/views/emailsend.ejs')

    const messages = {
        receivedMessage:AppStrings.RECIEVED_MESSAGE,
        sendPrivacyMessage:AppStrings.SEND_CODE_MESSAGE
    }

    ejs.renderFile(url_path, { fullName: fullName, messages, otp: otp, message: message }, async function (err: any, data: any) {
        await axios({
            method: 'post',
            url: 'https://api.smtp2go.com/v3/email/send',
            data: {
                api_key: "api-98A6BF74641611ED98A2F23C91BBF4A0",
                to: [to],
                sender: "beɘmz <noreply@beemz.com>",
                subject: subject,
                text_body: text_body,
                html_body: data,
                custom_headers: [
                    {
                        "header": "Reply-To",
                        "value": "beɘmz <noreply@beemz.com>"
                    }
                ]
            }
        }).catch(error => {
            console.log('line 66', error);
        })
    })
}

const businessMail = async (to: string, subject: string, text_body: string, sender: string, fullName: any, businessName:any, email: any, rejectReason: any, isApprove: any, message: string) => {
    let url_path: any = "";
    if (isApprove == 1) {
        url_path = path.join(__dirname, '/views/approvebusiness.ejs')
    } else if (isApprove == 2) {
        url_path = path.join(__dirname, '/views/rejectbusiness.ejs')
    }

    const message_ = {
        approve:AppStrings.APPROVE_BUSINESS,
        reject:AppStrings.REJECT_BUSINESS,
        thankYou:AppStrings.THANK_YOU,
        contact:AppStrings.BEEMZ_CONTACT,
    }    

    ejs.renderFile(url_path, { message_, fullName: fullName, businessName: businessName, email: email, rejectReason: rejectReason, message: message }, async function (err: any, data: any) {
        console.log(err);        
        await axios({
            method: 'post',
            url: 'https://api.smtp2go.com/v3/email/send',
            data: {
                api_key: "api-98A6BF74641611ED98A2F23C91BBF4A0",
                to: [to],
                sender: "beɘmz <noreply@beemz.com>",
                subject: subject,
                text_body: text_body,
                html_body: data,
                custom_headers: [
                    {
                        "header": "Reply-To",
                        "value": "beɘmz <noreply@beemz.com>"
                    }
                ]
            }
        }).catch(error => {
            console.log('line 66777777', error.message);
        })
    })
}

const reportReplyMail = async (to: string, subject: string, text_body: string, sender: string, message: string, fullName: any) => {
    const url_path = path.join(__dirname, '/views/reportreply.ejs')

    const messages = {
        thankYou:AppStrings.THANK_YOU,
        contact:AppStrings.BEEMZ_CONTACT,
    }

    ejs.renderFile(url_path, { fullName: fullName, messages, message: message }, async function (err: any, data: any) {
        
        await axios({
            method: 'post',
            url: 'https://api.smtp2go.com/v3/email/send',
            data: {
                api_key: "api-98A6BF74641611ED98A2F23C91BBF4A0",
                to: [to],
                sender: "beɘmz <noreply@beemz.com>",
                subject: subject,
                text_body: text_body,
                html_body: data,
                custom_headers: [
                    {
                        "header": "Reply-To",
                        "value": "beɘmz <noreply@beemz.com>"
                    }
                ]
            }
        }).catch(error => {
            console.log('line 66', error);
        })
    })
}

const contactByAdmin = async (to: string, subject: string, sender: string,text_body: string, email: string, message: string, name: any) => {
    const url_path = path.join(__dirname, '/views/contactusadmin.ejs')
    const messages = {
        thankYou:AppStrings.THANK_YOU,
    }

    ejs.renderFile(url_path, { name: name, messages, message: message}, async function (err: any, data: any) {
        
        await axios({
            method: 'post',
            url: 'https://api.smtp2go.com/v3/email/send',
            data: {
                api_key: "api-98A6BF74641611ED98A2F23C91BBF4A0",
                to: [to],
                sender: "beɘmz <noreply@beemz.com>",
                subject: subject,
                text_body: text_body,
                html_body: data,
                custom_headers: [
                    {
                        "header": "Reply-To",
                        "value": "beɘmz <noreply@beemz.com>"
                    }
                ]
            }
        }).catch(error => {
            console.log('line 66', error);
        })
    })
}


export default { sendMailOTP, verifyMail, businessMail, reportReplyMail,contactByAdmin };