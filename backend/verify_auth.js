const API_URL = 'http://localhost:5000/api/auth';

const uniqueId = Date.now();
const duplicatePayload = {
  companyName: `Test Company ${uniqueId}`,
  email: `test${uniqueId}@example.com`,
  contactNumber: `987654${uniqueId.toString().substring(7)}`,
  password: 'password123',
  role: 'TRADER'
};

async function post(endpoint, data) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function runTest() {
  console.log('--- Starting Auth Verification (Fetch) ---');

  // 1. Success Registration
  try {
    console.log('1. Testing Valid Registration...');
    const { status, body } = await post('/register', duplicatePayload);
    
    if (status === 201 && body.token) {
        console.log('✅ Registration SUCCESS');
    } else {
        console.log('❌ Registration FAILED:', status, body);
    }
  } catch (err) {
    console.log('❌ Registration ERROR:', err.message);
  }

  // 2. Duplicate Registration
  try {
    console.log('\n2. Testing Duplicate Registration...');
    const { status, body } = await post('/register', duplicatePayload);
    
    if (status === 409) {
         console.log('✅ Duplicate Registration Handled Correctly (409 Conflict):', body.message);
    } else {
         console.log('❌ Duplicate Registration Unexpected Status:', status, body);
    }
  } catch (err) {
    console.log('❌ Duplicate Registration ERROR:', err.message);
  }

  // 3. Login
  try {
    console.log('\n3. Testing Login...');
    const { status, body } = await post('/login', {
        email: duplicatePayload.email,
        password: duplicatePayload.password
    });

    if (status === 200 && body.token) {
        console.log('✅ Login SUCCESS');
    } else {
        console.log('❌ Login FAILED:', status, body);
    }
  } catch (err) {
    console.log('❌ Login ERROR:', err.message);
  }
}

runTest();
