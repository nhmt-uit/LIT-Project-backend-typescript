const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const fromPhoneNumber = process.env.FROM_PHONE_NUMBER;

const sendSMS = (toPhoneNumber: string, sms_authentication_code: number) => {
    return client.messages
        .create({
            body: `Your SMS authentication code: ${sms_authentication_code}`,
            from: fromPhoneNumber,
            to: toPhoneNumber
        })
        .then((message: any) => {
            console.log("Send SMS successful: ", message.sid)
        });
}

export default { sendSMS }