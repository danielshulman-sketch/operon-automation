const http = require('http');

function postRequest(path, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

function getRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function testLogin() {
    console.log("1. Fetching CSRF Token...");
    try {
        const csrfRes = await getRequest('/api/auth/csrf');
        const csrfData = JSON.parse(csrfRes.body);
        const csrfToken = csrfData.csrfToken;
        const cookies = csrfRes.headers['set-cookie'];

        console.log("CSRF Token:", csrfToken);
        // console.log("Cookies:", cookies);

        console.log("2. Attempting Login...");

        const postData = new URLSearchParams({
            'email': 'daniel.shulman@gmail.com',
            'password': 'password123',
            'csrfToken': csrfToken,
            'json': 'true',
            'redirect': 'false'
        }).toString();

        const loginRes = await postRequest('/api/auth/callback/credentials', postData, {
            'Cookie': cookies
        });

        console.log("Login Response Status:", loginRes.status);
        console.log("Login Response Body:", loginRes.body);

        if (loginRes.status === 200 || loginRes.status === 302) {
            console.log("SUCCESS: Login seems to work (200 is OK for JSON flow, 302 for redirect).");
        } else {
            console.log("FAILURE: Login rejected.");
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testLogin();
