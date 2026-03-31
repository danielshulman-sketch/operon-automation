const { authOptions } = require('./packages/social-feeds/src/lib/auth.ts'); // Wait, I can't require TS from JS easily without ts-node

// I'll just use the test-login script logic but targeting the running server
const testLogin = async () => {
    try {
        const response = await fetch('http://localhost:3010/api/auth/callback/credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'admin@example.com',
                password: 'password123',
                json: 'true',
                // callbackUrl: 'http://localhost:3010/'
            }),
        });

        console.log('Status:', response.status);
        const data = await response.text();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error.message);
    }
};

testLogin();
