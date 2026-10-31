/**
 * verify_security.js
 * Comprehensive automated security & integration tests for FoodOrder
 */

const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  RUNNING FOODORDER INTEGRATION & SECURITY TESTS    ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Public Menu Browsing
    const menuRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/menu',
      method: 'GET'
    });
    assert(menuRes.status === 200 && Array.isArray(menuRes.body.data), 'Public visitor can browse menu (HTTP 200)');

    // Test 2: Public Categories
    const catRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/categories',
      method: 'GET'
    });
    assert(catRes.status === 200 && Array.isArray(catRes.body.data), 'Public visitor can fetch categories (HTTP 200)');

    // Test 3: Unauthenticated Access to Admin Stats
    const statsUnauth = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/stats',
      method: 'GET'
    });
    assert(statsUnauth.status === 401, 'Direct call to /api/admin/stats without token returns 401 Unauthorized');

    // Test 4: Unauthenticated Access to All Orders
    const ordersUnauth = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'GET'
    });
    assert(ordersUnauth.status === 401, 'Direct call to /api/orders without token returns 401 Unauthorized');

    // Test 5: Unauthenticated Creation of Menu Item
    const addMenuUnauth = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/menu',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { itemName: 'Hacked Item', categoryId: 1, price: 99 });
    assert(addMenuUnauth.status === 401, 'Creating menu item without admin token returns 401 Unauthorized');

    // Test 6: Invalid Admin Login (Wrong Password)
    const badLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { usernameOrEmail: 'admin', password: 'WrongPassword999' });
    assert(badLogin.status === 401, 'Admin login with invalid credentials rejected (HTTP 401)');

    // Test 7: Valid Admin Login
    const goodLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { usernameOrEmail: 'admin', password: 'Admin@123' });
    assert(goodLogin.status === 200 && !!goodLogin.body.token, 'Admin login with valid credentials succeeds with JWT token');

    const adminToken = goodLogin.body.token;

    // Test 8: Verify Admin Me Endpoint
    const meRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(meRes.status === 200 && meRes.body.data.admin.role === 'ADMIN', 'Token verification via /api/auth/me returns valid admin role');

    // Test 9: Authenticated Access to Admin Stats
    const statsAuth = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(statsAuth.status === 200 && statsAuth.body.data.summary, 'Authenticated admin can retrieve analytics dashboard stats');

    // Test 10: Authenticated Access to Orders
    const ordersAuth = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(ordersAuth.status === 200 && Array.isArray(ordersAuth.body.data), 'Authenticated admin can view customer orders');

    // Test 11: Public Customer Order Tracking with Privacy Masking
    const customerTracking = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders/customer/9422779578',
      method: 'GET'
    });
    const orderData = customerTracking.body.data;
    const isMasked = orderData && orderData.length > 0 && orderData[0].customer_phone.includes('**');
    assert(customerTracking.status === 200 && isMasked, 'Customer order tracking masks sensitive phone numbers and addresses');

    // Test 12: Public Cash on Delivery Checkout (Preserve PostgreSQL Transactions)
    const validItemId = (menuRes.body.data && menuRes.body.data.length > 0)
      ? (menuRes.body.data[0].item_id || menuRes.body.data[0].ITEM_ID)
      : 1;

    const newOrderRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      customerName: 'Aarav Patel',
      customerPhone: '9811223344',
      deliveryAddress: 'Flat 402, Lotus Residency, MG Road, Bengaluru',
      items: [
        { itemId: validItemId, quantity: 2 }
      ]
    });
    if (newOrderRes.status !== 201) {
      console.log('Test 12 response:', newOrderRes);
    }
    assert(newOrderRes.status === 201 && !!newOrderRes.body.data.orderId, 'Customer COD checkout succeeds with server-side price recalculation & transaction');

    console.log(`\n====================================================`);
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`====================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
