const API_URL = 'http://localhost:5000/api';

async function verifyStrictSubscription() {
  console.log('--- Starting STRICT Subscription Verification ---');

  const email = `sub_strict_${Date.now()}@example.com`;
  const password = 'password123';
  const companyName = 'Strict Sub Co';
  const contactNumber = `777${Date.now().toString().slice(-7)}`;

  let token = '';

  try {
    // 1. Register
    console.log('\n1. Registering User...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName, contactNumber, role: 'TRADER' })
    });
    const regData = await regRes.json();
    
    if (!regRes.ok) throw new Error(regData.message || 'Registration failed');
    token = regData.token;
    console.log('✅ Registration SUCCESS');

    if (regData.isSubscribed) throw new Error('New user should NOT be subscribed');

    // 2. Activate Subscription
    console.log('\n2. Activating Subscription...');
    const subRes = await fetch(`${API_URL}/subscription/activate`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gst: 'GST123' })
    });
    const subData = await subRes.json();
    
    if (!subRes.ok) {
        console.error('Activate response:', JSON.stringify(subData, null, 2));
        throw new Error(subData.message || 'Subscription failed');
    }

    // STRICT CHECK: Response Structure
    const user = subData.data;
    if (user.isSubscribed !== true) throw new Error('isSubscribed is NOT true');
    if (!user.subscription || !user.subscription.id) throw new Error('subscription.id is missing');
    if (user.subscription.status !== 'ACTIVE') throw new Error('subscription.status is not ACTIVE');
    console.log('✅ Subscription Activation SUCCESS (Schema Validated)');

    // 3. Idempotency Check
    console.log('\n3. Checking Idempotency...');
    const idemRes = await fetch(`${API_URL}/subscription/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const idemData = await idemRes.json();
    
    if (idemData.data.subscription.id !== user.subscription.id) {
        throw new Error('Idempotency FAILED: Subscription ID changed!');
    }
    console.log('✅ Idempotency VERIFIED (Same Subscription ID)');

    // 4. Persistence Check (/me)
    console.log('\n4. Verifying Persistence via /me...');
    const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    
    // Note: getMe returns the user direct or in data? AuthController returns json(user).
    // Let's handle both just in case, but authController code says `res.json({...})`.
    // Wait, authController returns flat object.
    const meUser = meData.data || meData; 
    
    console.log('DEBUG: /me response body:', JSON.stringify(meData, null, 2));

    if (meUser.isSubscribed !== true) throw new Error('/me says isSubscribed is false');
    if (!meUser.subscription) throw new Error('/me missing subscription object');
    console.log('✅ Persistence VERIFIED');

    console.log('\n🎉 ALL STRICT TESTS PASSED!');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
}

verifyStrictSubscription();
