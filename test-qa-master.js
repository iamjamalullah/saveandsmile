/**
 * Save & Smile - Master Automated QA & Security Test Suite
 * Covers Phases 2, 3, 4, 5, 6, 7 & 8
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const testResults = [];

function recordTest(phase, testName, expected, actual, status, evidence) {
  testResults.push({
    phase,
    testName,
    expected,
    actual,
    status,
    evidence
  });
  const symbol = status === 'PASS' ? '✅' : (status === 'FAIL' ? '❌' : '⚠️');
  console.log(`${symbol} [${phase}] ${testName} -> ${status}`);
}

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

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 SAVE & SMILE MASTER QA & SECURITY AUTOMATION TEST');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // PHASE 2: ENVIRONMENT & BUILD INTEGRITY
  // ----------------------------------------------------
  console.log('--- Phase 2: Environment & Build Tests ---');
  
  // 2.1 Package & Config Integrity
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const hasVite = !!pkg.devDependencies?.vite;
    const hasDb = !!pkg.dependencies?.['@neondatabase/serverless'];
    const hasJwt = !!pkg.dependencies?.jsonwebtoken;
    const hasBcrypt = !!pkg.dependencies?.bcryptjs;
    if (hasVite && hasDb && hasJwt && hasBcrypt) {
      recordTest('Phase 2', 'Package Dependencies Check', 'Required dependencies present in package.json', 'All required dependencies found', 'PASS', 'Dependencies: vite, @neondatabase/serverless, jsonwebtoken, bcryptjs');
    } else {
      recordTest('Phase 2', 'Package Dependencies Check', 'Required dependencies present', 'Missing required dependencies', 'FAIL', JSON.stringify(pkg.dependencies));
    }
  } catch (e) {
    recordTest('Phase 2', 'Package Dependencies Check', 'Valid package.json', e.message, 'FAIL', e.stack);
  }

  // 2.2 Vercel Configuration Check
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
    const frameworkVite = vercelConfig.framework === 'vite';
    const apiRewrites = vercelConfig.rewrites?.some(r => r.source === '/api/(.*)');
    if (frameworkVite && apiRewrites) {
      recordTest('Phase 2', 'Vercel Deployment Config', 'framework: vite and API rewrites defined', 'Vercel configuration is valid', 'PASS', JSON.stringify(vercelConfig));
    } else {
      recordTest('Phase 2', 'Vercel Deployment Config', 'framework: vite defined', 'Invalid vercel.json', 'FAIL', JSON.stringify(vercelConfig));
    }
  } catch (e) {
    recordTest('Phase 2', 'Vercel Deployment Config', 'Valid vercel.json', e.message, 'FAIL', e.stack);
  }

  // ----------------------------------------------------
  // PHASE 3: STOREFRONT CATALOG & FUNCTIONAL DATA TESTS
  // ----------------------------------------------------
  console.log('\n--- Phase 3: Storefront Functional Tests ---');
  let products = [];
  try {
    products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
    if (Array.isArray(products) && products.length === 30) {
      recordTest('Phase 3', 'Product Catalog Integrity', 'Exact 30 authentic products in catalog', `${products.length} products loaded`, 'PASS', `Total products: ${products.length}, First product: ${products[0].title.slice(0, 30)}...`);
    } else {
      recordTest('Phase 3', 'Product Catalog Integrity', 'Valid catalog array of 30 products', `Count: ${products.length}`, 'FAIL', 'Catalog empty or mismatch');
    }
  } catch (e) {
    recordTest('Phase 3', 'Product Catalog Integrity', 'Loadable products.json', e.message, 'FAIL', e.stack);
  }

  // Check product data fields
  const sample = products[0] || {};
  const hasFields = sample.id && sample.title && sample.price && sample.image;
  if (hasFields) {
    recordTest('Phase 3', 'Product Data Schema Compliance', 'Products have id, title, price, image', 'All required attributes present', 'PASS', `Sample: ID=${sample.id}, Price=${sample.price}`);
  } else {
    recordTest('Phase 3', 'Product Data Schema Compliance', 'Valid product fields', 'Missing essential product fields', 'FAIL', JSON.stringify(sample));
  }

  // ----------------------------------------------------
  // PHASE 4: ADMIN AUTHENTICATION & AUTHORIZATION TESTS
  // ----------------------------------------------------
  console.log('\n--- Phase 4: Admin Auth & Security Tests ---');
  const authHandler = require('./api/auth');
  const productsHandler = require('./api/products');
  const ordersHandler = require('./api/orders');

  // 4.1 Valid Admin Login
  let adminToken = null;
  const reqAuthValid = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: { username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin123' }
  };
  const resAuthValid = mockRes();
  await authHandler(reqAuthValid, resAuthValid);
  const outAuthValid = resAuthValid._getResult();
  if (outAuthValid.statusCode === 200 && outAuthValid.data?.token) {
    adminToken = outAuthValid.data.token;
    recordTest('Phase 4', 'Valid Admin Login Credentials', 'Status 200 with JWT token', `Status 200, JWT generated (${adminToken.slice(0, 15)}...)`, 'PASS', `User: ${outAuthValid.data.user.username}, Role: ${outAuthValid.data.user.role}`);
  } else {
    recordTest('Phase 4', 'Valid Admin Login Credentials', 'Status 200 with token', `Status ${outAuthValid.statusCode}`, 'FAIL', JSON.stringify(outAuthValid.data));
  }

  // 4.2 Invalid Admin Password
  const reqAuthInvalid = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: { username: 'admin', password: 'wrong-password-999' }
  };
  const resAuthInvalid = mockRes();
  await authHandler(reqAuthInvalid, resAuthInvalid);
  const outAuthInvalid = resAuthInvalid._getResult();
  if (outAuthInvalid.statusCode === 401 && !outAuthInvalid.data?.token) {
    recordTest('Phase 4', 'Invalid Admin Password Rejection', 'Status 401 Unauthorized', 'Status 401 returned', 'PASS', outAuthInvalid.data?.error);
  } else {
    recordTest('Phase 4', 'Invalid Admin Password Rejection', 'Status 401', `Status ${outAuthInvalid.statusCode}`, 'FAIL', JSON.stringify(outAuthInvalid.data));
  }

  // 4.3 Missing Login Fields
  const reqAuthMissing = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: { username: '', password: '' }
  };
  const resAuthMissing = mockRes();
  await authHandler(reqAuthMissing, resAuthMissing);
  const outAuthMissing = resAuthMissing._getResult();
  if (outAuthMissing.statusCode === 400) {
    recordTest('Phase 4', 'Missing Login Fields Validation', 'Status 400 Bad Request', 'Status 400 returned', 'PASS', outAuthMissing.data?.error);
  } else {
    recordTest('Phase 4', 'Missing Login Fields Validation', 'Status 400', `Status ${outAuthMissing.statusCode}`, 'FAIL', JSON.stringify(outAuthMissing.data));
  }

  // 4.4 Admin Endpoint without Token
  const reqAdminNoToken = {
    method: 'GET',
    url: '/api/orders',
    headers: { host: 'localhost:5000' }
  };
  const resAdminNoToken = mockRes();
  await ordersHandler(reqAdminNoToken, resAdminNoToken);
  const outAdminNoToken = resAdminNoToken._getResult();
  if (outAdminNoToken.statusCode === 401) {
    recordTest('Phase 4', 'Admin Order Listing without Auth Token', 'Status 401 Unauthorized', 'Status 401 returned', 'PASS', outAdminNoToken.data?.error);
  } else {
    recordTest('Phase 4', 'Admin Order Listing without Auth Token', 'Status 401', `Status ${outAdminNoToken.statusCode}`, 'FAIL', JSON.stringify(outAdminNoToken.data));
  }

  // 4.5 Admin Endpoint with Tampered Token
  const reqAdminBadToken = {
    method: 'GET',
    url: '/api/orders',
    headers: { host: 'localhost:5000', authorization: 'Bearer fake.tampered.jwt.signature' }
  };
  const resAdminBadToken = mockRes();
  await ordersHandler(reqAdminBadToken, resAdminBadToken);
  const outAdminBadToken = resAdminBadToken._getResult();
  if (outAdminBadToken.statusCode === 401) {
    recordTest('Phase 4', 'Admin Endpoint with Tampered Token', 'Status 401 Unauthorized', 'Status 401 returned', 'PASS', outAdminBadToken.data?.error);
  } else {
    recordTest('Phase 4', 'Admin Endpoint with Tampered Token', 'Status 401', `Status ${outAdminBadToken.statusCode}`, 'FAIL', JSON.stringify(outAdminBadToken.data));
  }

  // 4.6 Product Creation Endpoint Protection (POST /api/products)
  const reqProdNoAuth = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: { title: 'Hacked Product', price: 10, image: 'hack.png' }
  };
  const resProdNoAuth = mockRes();
  await productsHandler(reqProdNoAuth, resProdNoAuth);
  const outProdNoAuth = resProdNoAuth._getResult();
  if (outProdNoAuth.statusCode === 401) {
    recordTest('Phase 4', 'Product Creation without Auth Token', 'Status 401 Unauthorized', 'Status 401 returned', 'PASS', outProdNoAuth.data?.error);
  } else {
    recordTest('Phase 4', 'Product Creation without Auth Token', 'Status 401', `Status ${outProdNoAuth.statusCode}`, 'FAIL', JSON.stringify(outProdNoAuth.data));
  }

  // ----------------------------------------------------
  // PHASE 5: CHECKOUT INTEGRITY & PRICE RECALCULATION
  // ----------------------------------------------------
  console.log('\n--- Phase 5: Checkout & Price Recalculation Tests ---');
  
  // Setup Isolated In-Memory Database Mock for Persistence & Recalculation
  const dbModule = require('./api/db');
  const storedOrders = [];
  const storedItems = [];

  const mockDbSql = async function(strings, ...values) {
    const query = strings.join('?');
    if (query.includes('FROM products')) {
      const searchedVal = values[0];
      const match = products.find(p => String(p.id) === String(searchedVal) || p.code === String(searchedVal));
      if (match) {
        return [{
          id: match.id,
          code: match.code,
          title: match.title,
          price: match.price,
          stock: 100
        }];
      }
      return [];
    }
    if (query.includes('INSERT INTO orders')) {
      const order = {
        id: 501,
        orderCode: values[0],
        subtotal: values[6],
        shippingFee: values[7],
        grandTotal: values[8],
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      storedOrders.push(order);
      return [order];
    }
    if (query.includes('INSERT INTO order_items')) {
      storedItems.push({
        order_id: values[0],
        product_id: values[1],
        title: values[2],
        price: values[3],
        qty: values[4],
        total: values[5]
      });
      return [];
    }
    if (query.includes('FROM orders') && query.includes('WHERE UPPER(order_code)')) {
      const searchTrack = String(values[0] || '').toUpperCase();
      if (searchTrack === 'SS-918273') {
        return [{
          id: 501,
          order_code: 'SS-918273',
          customer_name: 'Tariq Mehmood',
          customer_phone: '03331234567',
          customer_city: 'Islamabad',
          payment_method: 'COD',
          subtotal: 1500,
          shipping_fee: 200,
          grand_total: 1700,
          status: 'In Transit',
          courier: 'Leopards Courier Service',
          tracking_number: 'LEOP-918273',
          created_at: new Date().toISOString()
        }];
      }
      return [];
    }
    if (query.includes('FROM orders')) {
      return storedOrders;
    }
    return [];
  };

  const originalGetDb = dbModule.getDb;
  dbModule.getDb = () => mockDbSql;

  // Clear module cache
  delete require.cache[require.resolve('./api/orders')];
  const freshOrdersHandler = require('./api/orders');

  // 5.1 Tampered Price Protection & Calculation
  const testProd = products[0];
  const reqCheckoutTampered = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: {
      customerName: 'Ayesha Khan',
      customerPhone: '03211234567',
      customerAddress: 'DHA Phase 6',
      customerCity: 'Lahore',
      paymentMethod: 'COD',
      items: [
        { id: testProd.id, title: 'Hacked Product', price: 1, qty: 4 } // Client sent Rs. 1 instead of true price
      ]
    }
  };
  const resCheckoutTampered = mockRes();
  await freshOrdersHandler(reqCheckoutTampered, resCheckoutTampered);
  const outCheckoutTampered = resCheckoutTampered._getResult();

  const expectedSubtotal = testProd.price * 4;
  const expectedShipping = expectedSubtotal >= 3000 ? 0 : 200;
  const expectedGrandTotal = expectedSubtotal + expectedShipping;

  if (
    outCheckoutTampered.statusCode === 201 &&
    outCheckoutTampered.data?.subtotal === expectedSubtotal &&
    outCheckoutTampered.data?.grandTotal === expectedGrandTotal
  ) {
    recordTest('Phase 5', 'Client Price Tampering Immunity', `Subtotal: Rs. ${expectedSubtotal}, GrandTotal: Rs. ${expectedGrandTotal}`, `Server correctly calculated Subtotal: Rs. ${outCheckoutTampered.data.subtotal}, GrandTotal: Rs. ${outCheckoutTampered.data.grandTotal}`, 'PASS', `Tampered client price Rs. 1 ignored. True price Rs. ${testProd.price} enforced.`);
  } else {
    recordTest('Phase 5', 'Client Price Tampering Immunity', `Subtotal: ${expectedSubtotal}`, `Received: ${outCheckoutTampered.data?.subtotal}`, 'FAIL', JSON.stringify(outCheckoutTampered.data));
  }

  // 5.2 Negative / Invalid Quantity Validation
  const reqBadQty = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: {
      customerName: 'Ayesha Khan',
      customerPhone: '03211234567',
      customerAddress: 'DHA Phase 6',
      items: [{ id: testProd.id, qty: -10 }]
    }
  };
  const resBadQty = mockRes();
  await freshOrdersHandler(reqBadQty, resBadQty);
  const outBadQty = resBadQty._getResult();
  if (outBadQty.statusCode === 400) {
    recordTest('Phase 5', 'Negative Quantity Rejection', 'Status 400 Bad Request', 'Status 400 returned', 'PASS', outBadQty.data?.error);
  } else {
    recordTest('Phase 5', 'Negative Quantity Rejection', 'Status 400', `Status ${outBadQty.statusCode}`, 'FAIL', JSON.stringify(outBadQty.data));
  }

  // 5.3 Non-existent Product Validation
  const reqBadProd = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: {
      customerName: 'Ayesha Khan',
      customerPhone: '03211234567',
      customerAddress: 'DHA Phase 6',
      items: [{ id: '999999999-invalid', qty: 1 }]
    }
  };
  const resBadProd = mockRes();
  await freshOrdersHandler(reqBadProd, resBadProd);
  const outBadProd = resBadProd._getResult();
  if (outBadProd.statusCode === 400) {
    recordTest('Phase 5', 'Invalid Product ID Rejection', 'Status 400 Bad Request', 'Status 400 returned', 'PASS', outBadProd.data?.error);
  } else {
    recordTest('Phase 5', 'Invalid Product ID Rejection', 'Status 400', `Status ${outBadProd.statusCode}`, 'FAIL', JSON.stringify(outBadProd.data));
  }

  // 5.4 Free Shipping Rule (> Rs. 3000)
  const reqFreeShipping = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: {
      customerName: 'Wholesale Buyer',
      customerPhone: '03001234567',
      customerAddress: 'Saddar Market',
      items: [{ id: testProd.id, qty: 30 }] // 30 * 180 = 5400 > 3000 (Within stock 100)
    }
  };
  const resFreeShipping = mockRes();
  await freshOrdersHandler(reqFreeShipping, resFreeShipping);
  const outFreeShipping = resFreeShipping._getResult();
  if (outFreeShipping.statusCode === 201 && outFreeShipping.data?.shippingFee === 0) {
    recordTest('Phase 5', 'Free Shipping Threshold (>= Rs. 3,000)', 'Shipping Fee: Rs. 0', 'Shipping Fee is Rs. 0', 'PASS', `Subtotal: Rs. ${outFreeShipping.data.subtotal}, Shipping: Rs. 0`);
  } else {
    recordTest('Phase 5', 'Free Shipping Threshold (>= Rs. 3,000)', 'Shipping: 0', `Shipping: ${outFreeShipping.data?.shippingFee}`, 'FAIL', JSON.stringify(outFreeShipping.data));
  }

  // ----------------------------------------------------
  // PHASE 6: ORDER TRACKING & PRIVACY TESTS
  // ----------------------------------------------------
  console.log('\n--- Phase 6: Order Tracking & Privacy Tests ---');

  // 6.1 Public Tracking Privacy Sanitization
  const reqTrackPublic = {
    method: 'GET',
    url: '/api/orders?track=SS-918273',
    headers: { host: 'localhost:5000' }
  };
  const resTrackPublic = mockRes();
  await freshOrdersHandler(reqTrackPublic, resTrackPublic);
  const outTrackPublic = resTrackPublic._getResult();
  const orderData = outTrackPublic.data?.order;

  const phoneMasked = orderData?.customerPhone && orderData.customerPhone.includes('****');
  const addressOmitted = !orderData?.customerAddress;
  const statusPresent = orderData?.status === 'In Transit';

  if (outTrackPublic.statusCode === 200 && phoneMasked && addressOmitted && statusPresent) {
    recordTest('Phase 6', 'Order Tracking Customer Privacy Sanitization', 'Phone masked (****), Address omitted, Status returned', `Masked Phone: ${orderData.customerPhone}, Address Omitted: true`, 'PASS', `CustomerName: ${orderData.customerName}, Phone: ${orderData.customerPhone}, Address Expose: false`);
  } else {
    recordTest('Phase 6', 'Order Tracking Customer Privacy Sanitization', 'Masked sensitive fields', 'Sensitive fields exposed or missing', 'FAIL', JSON.stringify(orderData));
  }

  // 6.2 Invalid Tracking Code (404 Rejection)
  const reqTrackInvalid = {
    method: 'GET',
    url: '/api/orders?track=NONEXISTENT-999',
    headers: { host: 'localhost:5000' }
  };
  const resTrackInvalid = mockRes();
  await freshOrdersHandler(reqTrackInvalid, resTrackInvalid);
  const outTrackInvalid = resTrackInvalid._getResult();
  if (outTrackInvalid.statusCode === 404) {
    recordTest('Phase 6', 'Invalid Tracking ID 404 Rejection', 'Status 404 Not Found', 'Status 404 returned (No fake dummy order created)', 'PASS', outTrackInvalid.data?.error);
  } else {
    recordTest('Phase 6', 'Invalid Tracking ID 404 Rejection', 'Status 404', `Status ${outTrackInvalid.statusCode}`, 'FAIL', JSON.stringify(outTrackInvalid.data));
  }

  // ----------------------------------------------------
  // PHASE 7: DATABASE UNAVAILABILITY BEHAVIOR
  // ----------------------------------------------------
  console.log('\n--- Phase 7: Database Unavailability Behavior ---');
  // Explicitly simulate database outage / offline adapter
  dbModule.getDb = () => null;
  delete require.cache[require.resolve('./api/orders')];
  const offlineOrdersHandler = require('./api/orders');

  const reqDbDown = {
    method: 'POST',
    headers: { host: 'localhost:5000' },
    body: {
      customerName: 'Failover Test',
      customerPhone: '03001234567',
      customerAddress: 'Test Address',
      items: [{ id: testProd.id, qty: 1 }]
    }
  };
  const resDbDown = mockRes();
  await offlineOrdersHandler(reqDbDown, resDbDown);
  const outDbDown = resDbDown._getResult();
  if (outDbDown.statusCode === 503) {
    recordTest('Phase 7', 'Database Unavailability Safe Failover (503)', 'Status 503 with error message (No fake success)', 'Status 503 Service Unavailable returned', 'PASS', outDbDown.data?.error);
  } else {
    recordTest('Phase 7', 'Database Unavailability Safe Failover (503)', 'Status 503', `Status ${outDbDown.statusCode}`, 'FAIL', JSON.stringify(outDbDown.data));
  }

  // Restore DB adapter
  dbModule.getDb = originalGetDb;

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${testResults.length} | PASSED: ${testResults.filter(t => t.status === 'PASS').length} | FAILED: ${testResults.filter(t => t.status === 'FAIL').length}`);
  console.log('====================================================\n');

  return testResults;
}

runTestSuite().catch(console.error);
