// Test script to verify task update API
// Run with: node test-task-update.mjs

const taskId = 'YOUR_TASK_ID_HERE'; // Replace with actual task ID
const token = 'YOUR_AUTH_TOKEN_HERE'; // Replace with your auth token

const testPriorityUpdate = async () => {
    try {
        const res = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ priority: 'high' }),
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

const testAssignmentUpdate = async () => {
    try {
        const res = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ assignedTo: 'USER_ID_HERE' }),
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

console.log('Testing priority update...');
await testPriorityUpdate();

console.log('\nTesting assignment update...');
await testAssignmentUpdate();
