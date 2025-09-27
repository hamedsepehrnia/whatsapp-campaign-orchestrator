const https = require('https');

exports.zarinpalRequest = ({ merchantId, amount, description, callbackUrl, metadata }) => {
    const postData = JSON.stringify({
        merchant_id: merchantId,
        amount,
        description,
        callback_url: callbackUrl,
        metadata
    });

    const options = {
        hostname: 'api.zarinpal.com',
        port: 443,
        path: '/pg/v4/payment/request.json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
};

exports.zarinpalVerify = ({ merchantId, amount, authority }) => {
    const postData = JSON.stringify({
        merchant_id: merchantId,
        amount,
        authority
    });

    const options = {
        hostname: 'api.zarinpal.com',
        port: 443,
        path: '/pg/v4/payment/verify.json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
};


