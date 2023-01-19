import {EventEmitter} from 'events';
import Mail from '../../src/components/email';
import Phone from '../../src/components/phone';
import {io} from "../index";

const eventEmitter = new EventEmitter();

// eventEmitter.on('send_email', (data: any) => {
//     Mail.sendMailOTP(data.to, data.subject, data.data.message, data.data.otp);
// });

eventEmitter.on('send_email_otp', (data: any) => {
    try {
        Mail.verifyMail(data.to, data.subject, data.text_body, data.sender, data.data.otp, data.data.message,  data.data.fullName);
    } catch (error: any) {
        return console.log(error.message);      
    }
});

eventEmitter.on('send_email_report_reply', (data: any) => {
    try {
        Mail.reportReplyMail(data.to, data.subject, data.text_body, data.sender, data.data.message,  data.data.fullName);
    } catch (error: any) {
        return console.log(error.message);      
    }
});

eventEmitter.on('user_to_admin_contact_us', (data: any) => {
    try {
        Mail.contactByAdmin(data.to, data.subject, data.sender,data.text_body, data.data.email, data.data.message,  data.data.name);
    } catch (error: any) {
        return console.log(error.message);      
    }
});

eventEmitter.on('send_email_business', (data: any) => {
    try {
        Mail.businessMail(data.to, data.subject, data.text_body, data.sender, data.data.fullName, data.data.businessName, data.data.email, data.data.rejectReason, data.data.isApprove, data.data.message);
    } catch (error: any) {
        console.log(123456789);
        
        return console.log(error.message);      
    }
});

eventEmitter.on('send_phone_otp', (data: any) => {
    try {
        Phone.sendPhoneOTP(data.to);
    } catch (error: any) {
        return console.log(error.message);      
    }
});



export default eventEmitter;