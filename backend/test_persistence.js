const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'secret123';
const USER_ID = '697852dcf6d4de169580422e'; // A subscribed user ID
const COMPANY_ID = '69798db1619ccc0a6cdc435f'; // "krishna" company ID

const testPersistence = async () => {
    try {
        // 1. Generate Token
        const token = jwt.sign({ id: USER_ID }, JWT_SECRET, { expiresIn: '30d' });
        console.log('generated token:', token);

        // 2. Make Request
        const payload = {
            companyId: COMPANY_ID,
            rating: 5,
            wouldDealAgain: true,
            comment: "Direct API Test Persistence " + Date.now()
        };

        console.log('Sending payload:', payload);

        const res = await axios.post('http://localhost:5000/api/reviews', payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Response Status:', res.status);
        console.log('Response Data:', res.data);

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
};

testPersistence();
