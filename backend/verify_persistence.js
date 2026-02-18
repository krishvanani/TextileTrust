const API_URL = 'http://localhost:5000/api';

async function verifyPersistence() {
  console.log('--- STARTING PERSISTENCE VERIFICATION ---');
  
  const timestamp = Date.now();
  const email = `persist_${timestamp}@test.com`;
  const password = 'password123';
  
  try {
    // 1. Register User
    console.log('\n[1] Registering User...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email, password, 
            companyName: `Persist Co ${timestamp}`,
            contactNumber: `999${timestamp.toString().slice(-7)}`,
            role: 'TRADER'
        })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(regData.message);
    const token = regData.token;
    console.log('✅ User Created:', regData._id);

    // 2. Activate Subscription (Required for other actions)
    console.log('\n[2] Activating Subscription...');
    const subRes = await fetch(`${API_URL}/subscription/activate`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ gst: `GST${timestamp}` })
    });
    const subData = await subRes.json();
    if (!subRes.ok) throw new Error(subData.message);
    
    if (!subData.data.subscription || !subData.data.subscription.id) {
        throw new Error('Subscription ID missing in response');
    }
    console.log('✅ Subscription Created:', subData.data.subscription.id);

    // 3. Register Company
    console.log('\n[3] Registering Company...');
    const compRes = await fetch(`${API_URL}/companies/register`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
            name: `Real Persist Corp ${timestamp}`,
            gst: `27ABCDE${timestamp.toString().slice(-4)}1Z5`,
            city: 'Mumbai',
            businessType: 'Manufacturer',
            officialPhone: '9876543210'
        })
    });
    const compData = await compRes.json();
    console.log(`DEBUG: Company Response [${compRes.status}]:`, JSON.stringify(compData, null, 2));

    if (!compRes.ok) throw new Error(compData.message);
    console.log('✅ Company Created:', compData._id);

    // 4. Create Review (on self? No, need another company. But for test, let's try to review a mock or existing provided ID if any. 
    // Wait, I can't review my own company. 
    // I need a second user to review this company.
    
    console.log('\n[4] creating 2nd user for Review...');
    const user2Email = `reviewer_${timestamp}@test.com`;
    const reg2Res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: user2Email, password, 
            companyName: `Reviewer Co ${timestamp}`,
            contactNumber: `888${timestamp.toString().slice(-7)}`,
            role: 'TRADER'
        })
    });
    const reg2Data = await reg2Res.json();
    const token2 = reg2Data.token;
    
    // Subscribe user 2
    await fetch(`${API_URL}/subscription/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
        body: JSON.stringify({})
    });

    console.log('[4b] Writing Review...');
    const reviewRes = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token2}` 
        },
        body: JSON.stringify({
            companyId: compData._id,
            rating: 5,
            comment: 'Persistence Test Review',
            dealAgain: true
        })
    });
    const reviewData = await reviewRes.json();
    if (!reviewRes.ok) throw new Error(reviewData.message);
    console.log('✅ Review Created:', reviewData._id);

    console.log('\n🎉 ALL ENTITIES CREATED SUCCESSFULLY');
    console.log('--- PLEASE CHECK MONGODB COMPASS ---');
    console.log(`Database: textiletrust`);
    console.log(`Company ID: ${compData._id}`);
    console.log(`Subscription ID: ${subData.data.subscription.id}`);
    console.log(`Review ID: ${reviewData._id}`);

  } catch (err) {
      console.error('❌ FAILURE:', err.message);
      process.exit(1);
  }
}

verifyPersistence();
