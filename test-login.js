// Quick test script to verify login API works
require('dotenv').config({ path: './packages/frontend/.env.local' });

const testLogin = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'daniel.shulman@gmail.com',
                password: 'Dcdefe356e4e4'
            }),
        });

        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✅ Login successful!');
            console.log('Token:', data.token.substring(0, 20) + '...');
            console.log('User:', data.user.email);
        } else {
            console.log('\n❌ Login failed:', data.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testLogin();
