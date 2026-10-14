/**
 * Save & Smile Pakistan - AI Customer Support Assistant Endpoint
 * Serverless API /api/chat
 * 
 * Capable of:
 * 1. Answering customer questions in Urdu, Roman Urdu, and English
 * 2. Answering store policies:
 *    - EasyPaisa: 03337221552
 *    - Bank Transfer: Faysal Bank, Title: Muhammd Jamalullah, Account: 3516390000005787
 *    - Cash on Delivery (COD): Across Pakistan
 *    - Delivery: 2-3 working days, Free on Rs. 3,000+ otherwise Rs. 200
 *    - Wholesale WhatsApp: 0316-2323616
 *    - 7 Days Checking Warranty
 * 3. Searching and recommending relevant live products directly from products catalog
 * 4. Fallback / AI Engine support with optional GEMINI_API_KEY / OPENAI_API_KEY or smart built-in natural response engine
 */

const fs = require('fs');
const path = require('path');

function getProductsCatalog() {
  try {
    const pPath = path.join(process.cwd(), 'products.json');
    if (fs.existsSync(pPath)) {
      return JSON.parse(fs.readFileSync(pPath, 'utf8'));
    }
  } catch (e) {}
  return [];
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const message = (body.message || '').trim();

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const catalog = getProductsCatalog();
    const reply = await generateAiReply(message, catalog);

    return res.status(200).json({
      success: true,
      reply: reply
    });
  } catch (err) {
    console.error('AI Chat Error:', err);
    return res.status(500).json({
      success: false,
      reply: '🤖 Maazrat! AI assistant busy hai. Aap direct hamari WhatsApp helpline 0316-2323616 par rabta kar sakte hain.'
    });
  }
};

async function generateAiReply(userText, catalog) {
  const query = userText.toLowerCase();

  // If Gemini API Key is configured in environment
  if (process.env.GEMINI_API_KEY) {
    try {
      const externalAiReply = await callGeminiApi(userText, catalog);
      if (externalAiReply) return externalAiReply;
    } catch (geminiErr) {
      console.warn('Gemini API call failed, using intelligent rule engine:', geminiErr.message);
    }
  }

  // If OpenAI API Key is configured in environment
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiReply = await callOpenAiApi(userText, catalog);
      if (openaiReply) return openaiReply;
    } catch (openaiErr) {
      console.warn('OpenAI API call failed, using intelligent rule engine:', openaiErr.message);
    }
  }

  // Built-in High-Accuracy Natural Language Engine
  return generateIntelligentEngineReply(query, userText, catalog);
}

function generateIntelligentEngineReply(q, rawText, catalog) {
  // 1. Payment Methods Inquiry
  if (q.includes('payment') || q.includes('easypaisa') || q.includes('faysal') || q.includes('bank') || q.includes('jazzcash') || q.includes('pesy') || q.includes('ada') || q.includes('account') || q.includes('cod') || q.includes('cash on delivery')) {
    return `💳 <strong>Accepted Payment Methods:</strong><br><br>
    1. <strong>Cash on Delivery (COD):</strong> Pay in cash directly to the courier upon parcel delivery anywhere in Pakistan.<br>
    2. <strong>EasyPaisa:</strong> <code>0333-7221552</code> (Title: Muhammad Jamalullah)<br>
    3. <strong>Bank Transfer (Faysal Bank):</strong><br>
    • <strong>Bank Name:</strong> Faysal Bank<br>
    • <strong>Account Title:</strong> Muhammd Jamalullah<br>
    • <strong>Account Number:</strong> <code>3516390000005787</code><br><br>
    <em>After sending payment via EasyPaisa or Bank Transfer, please send the screenshot to our WhatsApp helpline at <strong>0316-2323616</strong>.</em>`;
  }

  // 2. Delivery & Shipping
  if (q.includes('delivery') || q.includes('shipping') || q.includes('charges') || q.includes('kitne din') || q.includes('kab tak') || q.includes('reach') || q.includes('free delivery') || q.includes('time') || q.includes('how long')) {
    return `🚚 <strong>Shipping & Delivery Policy:</strong><br><br>
    • <strong>Delivery Time:</strong> 2 to 3 business days across Pakistan (24-48 hours in Karachi & Lahore).<br>
    • <strong>FREE Delivery:</strong> Available on all orders of <strong>Rs. 3,000 or more</strong>!<br>
    • <strong>Standard Shipping:</strong> Only Rs. 200 for orders under Rs. 3,000.<br>
    • Dispatched safely through Leopards, Trax & PostEx couriers.`;
  }

  // 3. Wholesale & Bulk
  if (q.includes('wholesale') || q.includes('bulk') || q.includes('carton') || q.includes('resell') || q.includes('shopkeeper') || q.includes('dokan') || q.includes('quantity')) {
    return `📦 <strong>Wholesale & Bulk Inquiries:</strong><br><br>
    Save & Smile offers direct factory rates for shopkeepers, online resellers, and carton buyers.<br>
    For bulk carton discounts and dealer quotes, please connect with our wholesale department on WhatsApp:<br>
    👉 <a href="https://wa.me/923162323616?text=Hello!%20I%20am%20interested%20in%20bulk%20wholesale%20rates" target="_blank" style="color: #007382; font-weight: 700; text-decoration: underline;">+92 316-2323616</a>`;
  }

  // 4. Return, Replacement & Warranty
  if (q.includes('return') || q.includes('replace') || q.includes('warranty') || q.includes('kharaab') || q.includes('damage') || q.includes('wapsi') || q.includes('refund') || q.includes('broken')) {
    return `🛡️ <strong>7-Day Replacement Guarantee:</strong><br><br>
    All our products come with a <strong>7-day checking & replacement warranty</strong>.<br>
    If you receive a defective or damaged product, simply record a brief unboxing video and share it with our WhatsApp support at <strong>0316-2323616</strong>. Our team will arrange a quick replacement!`;
  }

  // 5. Order Tracking
  if (q.includes('track') || q.includes('status') || q.includes('mera order') || q.includes('kahan he') || q.includes('where is my order')) {
    return `📍 <strong>Live Order Tracking:</strong><br><br>
    You can easily track your order in real time on our <a href="/track-order" style="color: #007382; font-weight: 700; text-decoration: underline;">Track Order Page</a> by entering your Order ID (e.g., SS-100234) or Phone Number!`;
  }

  // 6. Greetings & Help
  if (q.includes('salam') || q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('help') || q.includes('aoa')) {
    return `Hello and welcome to Save & Smile! 👋<br><br>
    I am your AI Store Assistant. I can assist you with product details, wholesale bulk rates, delivery timelines, payment accounts (COD, EasyPaisa, Faysal Bank), and order tracking. How can I help you today?`;
  }

  // 7. Dynamic Product Catalog Search
  if (catalog && catalog.length > 0) {
    const matched = catalog.filter(p => {
      const t = (p.title || '').toLowerCase();
      const d = (p.description || '').toLowerCase();
      const c = (p.category || '').toLowerCase();
      return q.split(/\s+/).some(word => word.length >= 3 && (t.includes(word) || d.includes(word) || c.includes(word)));
    }).slice(0, 3);

    if (matched.length > 0) {
      let prodList = matched.map(p => `• <strong>${p.title}</strong> — Rs. ${Number(p.price).toLocaleString()} <a href="/product-detail?id=${p.id}" style="color: #007382; font-weight: 700; text-decoration: underline;">[View Product]</a>`).join('<br>');
      return `✨ <strong>Found matching items in our store:</strong><br><br>${prodList}<br><br>You can place an order directly or contact us on WhatsApp for carton pricing!`;
    }
  }

  // 8. General / Helpful Fallback
  return `🤖 Thank you for your question!<br><br>
  Save & Smile is Pakistan's leading wholesale portal. We offer Cash on Delivery (COD) as well as advance payments via <strong>EasyPaisa (0333-7221552)</strong> and <strong>Faysal Bank (Account: 3516390000005787)</strong>.<br><br>
  For personalized wholesale support or custom inquiries, chat with us on WhatsApp at <strong>0316-2323616</strong>!`;
}

async function callGeminiApi(userPrompt, catalog) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemContext = `You are the friendly, expert AI Customer Support Assistant for "Save & Smile" (saveandsmile.pk), Pakistan's top wholesale e-commerce store.
Reply in polite, helpful Urdu, Roman Urdu, or English matching the user's language.
Key Store Information:
- Payment Options: 
  1. Cash on Delivery (COD) across Pakistan.
  2. EasyPaisa: 03337221552.
  3. Bank Transfer: Faysal Bank, Title: Muhammd Jamalullah, Account Number: 3516390000005787.
- Delivery: 2-3 working days across Pakistan. Free shipping on orders Rs. 3,000+, otherwise Rs. 200 delivery fee.
- Wholesale WhatsApp: 0316-2323616 for carton/bulk discounts.
- Warranty: 7 days checking & replacement warranty.
- Tracking: Available at /track-order.html using Order ID or Phone number.
Keep answers concise, professional, formatted with simple HTML tags like <strong> and <br>.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `${systemContext}\n\nCustomer question: ${userPrompt}` }
        ]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.replace(/\n/g, '<br>') : null;
}

async function callOpenAiApi(userPrompt, catalog) {
  const apiKey = process.env.OPENAI_API_KEY;
  const url = 'https://api.openai.com/v1/chat/completions';

  const systemMessage = `You are the official AI Support Agent for "Save & Smile" Pakistan wholesale store. 
Answer concisely in friendly Roman Urdu / Urdu / English.
Payments: COD, EasyPaisa (03337221552), and Faysal Bank (Title: Muhammd Jamalullah, Account: 3516390000005787).
Delivery: 2-3 working days, Free for Rs. 3,000+, else Rs. 200.
WhatsApp: 0316-2323616.
Warranty: 7 Days Replacement.
Use clean HTML formatting with <strong> and <br>.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 350
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API returned status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  return text ? text.replace(/\n/g, '<br>') : null;
}
