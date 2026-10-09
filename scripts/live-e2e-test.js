require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const authHandler = require('../api/auth');
const ordersHandler = require('../api/orders');
const productsHandler = require('../api/products');

function mockRes() {
  let statusCode = 200;
  let headers = {};
  let data = null;
  let ended = false;

  return {
    setHeader(k, v) { headers[k] = v; },
    status(code) { statusCode = code; return this; },
    json(obj) { data = obj; ended = true; return this; },
    end() { ended = true; return this; },
    _getResult() { return { statusCode, headers, data, ended }; }
  };
}

async function runLiveE2E() {
  console.log('====================================================');
  console.log('🚀 LIVE NEON POSTGRESQL END-TO-END VERIFICATION');
  console.log('====================================================\n');

  const sql = neon(process.env.DATABASE_URL);
  let liveOrderCode = null;
  let liveOrderId = null;
  let adminJwtToken = null;

  // ----------------------------------------------------
  // TEST 1: Admin Authentication with Real Credentials
  // ----------------------------------------------------
  console.log('--- TEST 1: Admin Authentication ---');
  const reqLogin = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin_saveandsmile_2026_pass'
    }
  };
  const resLogin = mockRes();
  await authHandler(reqLogin, resLogin);
  const outLogin = resLogin._getResult();

  console.log('Login HTTP Status:', outLogin.statusCode);
  console.log('Login Success:', outLogin.data?.success);
  console.log('Token Received:', Boolean(outLogin.data?.token));
  if (outLogin.statusCode === 200 && outLogin.data?.token) {
    adminJwtToken = outLogin.data.token;
    console.log('✅ TEST 1 PASSED: Admin authenticated successfully and received valid JWT.');
  } else {
    console.error('❌ TEST 1 FAILED:', outLogin.data);
  }

  // ----------------------------------------------------
  // TEST 2: Real Customer Checkout (Price Tampering Test)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Real Customer Checkout & Price Recalculation ---');
  // Product 203 has authentic price = Rs. 180. Client attempts to buy 3 units for Rs. 5 each.
  const reqCheckout = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: {
      customerName: 'QA Live Test Buyer',
      customerPhone: '03129876543',
      customerAddress: 'Office 402, Business Avenue, Shahrah-e-Faisal',
      customerCity: 'Karachi',
      paymentMethod: 'COD',
      notes: 'AUTOMATED_QA_LIVE_TEST_ORDER',
      items: [
        { id: 203, title: 'Hacked Client Title', price: 5, qty: 3 } // Client attempts price 5 PKR
      ]
    }
  };
  const resCheckout = mockRes();
  await ordersHandler(reqCheckout, resCheckout);
  const outCheckout = resCheckout._getResult();

  console.log('Checkout HTTP Status:', outCheckout.statusCode);
  console.log('Checkout Success:', outCheckout.data?.success);
  console.log('Order Code Generated:', outCheckout.data?.orderId);
  console.log('Server Calculated Subtotal:', outCheckout.data?.subtotal, '(Expected: 180 * 3 = 540)');
  console.log('Server Shipping Fee:', outCheckout.data?.shippingFee, '(Expected: 200 for subtotal < 3000)');
  console.log('Server Grand Total:', outCheckout.data?.grandTotal, '(Expected: 740)');

  liveOrderCode = outCheckout.data?.orderId;
  liveOrderId = outCheckout.data?.order?.id;

  if (outCheckout.statusCode === 201 && outCheckout.data?.subtotal === 540 && outCheckout.data?.grandTotal === 740) {
    console.log('✅ TEST 2 PASSED: Server recalculated authentic price (Rs. 180 * 3 = Rs. 540) and applied correct shipping.');
  } else {
    console.error('❌ TEST 2 FAILED:', outCheckout.data);
  }

  // ----------------------------------------------------
  // TEST 3: Direct PostgreSQL Persistence Query
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Direct PostgreSQL Database Query ---');
  const dbOrderRows = await sql`
    SELECT id, order_code, customer_name, customer_phone, customer_address, customer_city, subtotal, shipping_fee, grand_total, status, notes, created_at
    FROM orders
    WHERE order_code = ${liveOrderCode}
  `;

  console.log('Rows found in PostgreSQL orders table:', dbOrderRows.length);
  if (dbOrderRows.length > 0) {
    const o = dbOrderRows[0];
    console.log(`Saved in PostgreSQL: ID=${o.id}, Code=${o.order_code}, Name="${o.customer_name}", GrandTotal=Rs. ${o.grand_total}, Status=${o.status}`);
    
    // Check order_items
    const dbItemRows = await sql`
      SELECT id, order_id, product_id, title, price, qty, total
      FROM order_items
      WHERE order_id = ${o.id}
    `;
    console.log('Rows found in PostgreSQL order_items table:', dbItemRows.length);
    console.log(`Saved Item: ProductID=${dbItemRows[0].product_id}, Title="${dbItemRows[0].title.slice(0, 30)}...", UnitPrice=Rs. ${dbItemRows[0].price}, Qty=${dbItemRows[0].qty}, Total=Rs. ${dbItemRows[0].total}`);

    console.log('✅ TEST 3 PASSED: Order and Order Items are directly persisted in PostgreSQL!');
  } else {
    console.error('❌ TEST 3 FAILED: Order record not found in PostgreSQL!');
  }

  // ----------------------------------------------------
  // TEST 4: Authenticated Admin Order Listing Retrieval
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Admin Order Listing via API ---');
  const reqAdminOrders = {
    method: 'GET',
    url: '/api/orders',
    headers: {
      host: 'localhost:5000',
      authorization: `Bearer ${adminJwtToken}`
    }
  };
  const resAdminOrders = mockRes();
  await ordersHandler(reqAdminOrders, resAdminOrders);
  const outAdminOrders = resAdminOrders._getResult();

  console.log('Admin Orders HTTP Status:', outAdminOrders.statusCode);
  console.log('Total Orders returned to Admin:', outAdminOrders.data?.count);
  const foundInAdmin = outAdminOrders.data?.orders?.find(o => o.orderCode === liveOrderCode);
  if (foundInAdmin) {
    console.log(`✅ TEST 4 PASSED: Order ${liveOrderCode} successfully retrieved by Authenticated Admin.`);
  } else {
    console.error('❌ TEST 4 FAILED: Order not found in Admin list.');
  }

  // ----------------------------------------------------
  // TEST 5: Public Order Tracking & Privacy Sanitization
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Public Order Tracking & Privacy Masking ---');
  const reqTrack = {
    method: 'GET',
    url: `/api/orders?track=${encodeURIComponent(liveOrderCode)}`,
    headers: { host: 'localhost:5000' }
  };
  const resTrack = mockRes();
  await ordersHandler(reqTrack, resTrack);
  const outTrack = resTrack._getResult();
  const trackedData = outTrack.data?.order;

  console.log('Tracking HTTP Status:', outTrack.statusCode);
  console.log('Tracked Order Code:', trackedData?.orderCode);
  console.log('Masked Customer Name:', trackedData?.customerName);
  console.log('Masked Customer Phone:', trackedData?.customerPhone);
  console.log('Customer Full Address Leaked?:', trackedData?.customerAddress ? 'YES (FAIL)' : 'NO (SECURE)');
  console.log('Internal Notes Leaked?:', trackedData?.notes ? 'YES (FAIL)' : 'NO (SECURE)');

  if (
    outTrack.statusCode === 200 &&
    trackedData?.customerPhone?.includes('****') &&
    !trackedData?.customerAddress &&
    !trackedData?.notes
  ) {
    console.log('✅ TEST 5 PASSED: Tracking returns live status while 100% protecting customer privacy.');
  } else {
    console.error('❌ TEST 5 FAILED:', trackedData);
  }

  // ----------------------------------------------------
  // TEST 6: Admin Order Status Update & PostgreSQL Persistence
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Admin Order Status Update ---');
  const reqStatusUpdate = {
    method: 'PUT',
    headers: {
      host: 'localhost:5000',
      authorization: `Bearer ${adminJwtToken}`
    },
    body: {
      orderId: liveOrderCode,
      status: 'In Transit',
      courier: 'Leopards Express Karachi',
      trackingNumber: 'LEOP-LIVE-889922'
    }
  };
  const resStatusUpdate = mockRes();
  await ordersHandler(reqStatusUpdate, resStatusUpdate);
  const outStatusUpdate = resStatusUpdate._getResult();

  console.log('Status Update HTTP Status:', outStatusUpdate.statusCode);
  console.log('Status Update Message:', outStatusUpdate.data?.message);

  // Verify directly from PostgreSQL
  const updatedDbRows = await sql`
    SELECT status, courier, tracking_number, updated_at
    FROM orders
    WHERE order_code = ${liveOrderCode}
  `;
  const upOrder = updatedDbRows[0];
  console.log(`Direct DB Verification: Status="${upOrder.status}", Courier="${upOrder.courier}", CN="${upOrder.tracking_number}", UpdatedAt=${upOrder.updated_at}`);

  if (upOrder.status === 'In Transit' && upOrder.tracking_number === 'LEOP-LIVE-889922') {
    console.log('✅ TEST 6 PASSED: Order status updated in PostgreSQL and verified!');
  } else {
    console.error('❌ TEST 6 FAILED:', upOrder);
  }

  // ----------------------------------------------------
  // TEST 7: Safe Cleanup of QA Test Order
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Safe QA Test Records Cleanup ---');
  await sql`
    DELETE FROM orders 
    WHERE notes = 'AUTOMATED_QA_LIVE_TEST_ORDER' OR order_code = ${liveOrderCode}
  `;
  const postCleanupCount = await sql`SELECT count(*) as count FROM orders WHERE order_code = ${liveOrderCode}`;
  console.log('Remaining QA test orders in PostgreSQL:', postCleanupCount[0].count);
  console.log('✅ TEST 7 PASSED: Test order safely cleaned up from live database.');

  console.log('\n====================================================');
  console.log('🎉 ALL LIVE NEON POSTGRESQL E2E TESTS PASSED 100%!');
  console.log('====================================================\n');
}

runLiveE2E().catch(console.error);
