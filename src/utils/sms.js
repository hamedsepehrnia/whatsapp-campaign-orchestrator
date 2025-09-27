const Kavenegar = require('kavenegar');

const api = Kavenegar.KavenegarApi({
    apikey: process.env.KAVENEGAR_API_KEY || '477A765765377A6E536669746D34454F41314C44655844494B39797868363544515137556D6F69634667733D'
});

exports.sendSms = async (phone, message) => {
    return new Promise((resolve) => {
        try {
            // Remove leading zero and add country code for Iran
            const formattedPhone = phone.startsWith('0') ? phone.slice(1) : phone;
            
            api.Send({
                message: message,
                sender: process.env.KAVENEGAR_SENDER || '2000660110',
                receptor: formattedPhone
            }, (response, status) => {
                if (status === 200) {
                    console.log(`[SMS -> ${phone}] Sent successfully:`, response);
                    resolve({ success: true, result: response });
                } else {
                    console.error(`[SMS -> ${phone}] Failed:`, response);
                    // Fallback to console log if API fails
                    console.log(`[SMS FALLBACK -> ${phone}] ${message}`);
                    resolve({ success: false, error: response });
                }
            });
        } catch (error) {
            console.error(`[SMS -> ${phone}] Error:`, error.message);
            // Fallback to console log if API fails
            console.log(`[SMS FALLBACK -> ${phone}] ${message}`);
            resolve({ success: false, error: error.message });
        }
    });
};


