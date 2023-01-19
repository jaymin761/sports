const config = require('config');
const Twilio = require('twilio');
let twilioClient = new Twilio(
    config.get('TWILIO_API_KEY'), config.get('TWILIO_API_SECRET'), {accountSid: config.get('TWILIO_ACCOUNT_SID'),}
);
const client = require('twilio')(config.get('TWILIO_ACCOUNT_SID'), config.get('TWILIO_AUTH_TOKEN'));

const sendPhoneOTP = (to:string) => {
    twilioClient.verify.services(config.get('TWILIO_VERIFY_SERVICE_ID'))
            .verifications
            .create({to: to, channel: 'sms'})
            .then((verification : any) => {
                console.log("STATUSSS : ", verification)
                return true
            }).catch((reason : any) => {
              console.log('error name',reason);
              
                return false
        })
};


const verifyPhoneOtp = (to: string, otp: string) =>
  client.verify.v2
    .services(config.get("TWILIO_VERIFY_SERVICE_ID"))
    .verificationChecks.create({ to: to, code: otp })
    .then((verification_check: any) => {
      console.log("VERIFICATION: ", verification_check.status);
      if (verification_check?.status === "approved") {        
        return [true,null];
      } else {
        return [null,'not approved'];
      }
    })
    .catch((reason: any) => {      
      return [null, reason.message ];
    });

export default { sendPhoneOTP, verifyPhoneOtp };