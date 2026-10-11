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
  if (q.includes('payment') || q.includes('easypaisa') || q.includes('faysal') || q.includes('bank') || q.includes('jazzcash') || q.includes('pesy') || q.includes('ada') || q.includes('account')) {
    return `💳 <strong>Payment Details (طریقہ ادائیگی):</strong><br><br>
    1. <strong>Cash on Delivery (COD):</strong> Parcel milne par rider ko cash ada karein.<br>
    2. <strong>EasyPaisa:</strong> <code>03337221552</code><br>
    3. <strong>Bank Transfer (Faysal Bank):</strong><br>
    • <strong>Bank:</strong> Faysal Bank<br>
    • <strong>Title:</strong> Muhammd Jamalullah<br>
    • <strong>Account Number:</strong> <code>3516390000005787</code><br><br>
    <em>Note: EasyPaisa ya Bank Transfer k baad screenshot WhatsApp helpline 0316-2323616 par share karein.</em>`;
  }

  // 2. Delivery & Shipping
  if (q.includes('delivery') || q.includes('shipping') || q.includes('charges') || q.includes('kitne din') || q.includes('kab tak') || q.includes('reach') || q.includes('free delivery')) {
    return `🚚 <strong>Delivery & Shipping Policy:</strong><br><br>
    • Delivery time pooray Pakistan mein <strong>2 se 3 working days</strong> hai.<br>
    • <strong>Rs. 3,000 یا اس سے زائد</strong> کے آرڈر پر <strong>FREE Delivery</strong> ہے!<br>
    • Rs. 3,000 se kam order par delivery charges sirf Rs. 200 hain.<br>
    • Trax / Call Courier k zariye mehfooz dispatch ki jati hai.`;
  }

  // 3. Wholesale & Bulk
  if (q.includes('wholesale') || q.includes('bulk') || q.includes('carton') || q.includes('resell') || q.includes('shopkeeper') || q.includes('dokan')) {
    return `📦 <strong>Wholesale & Bulk Orders:</strong><br><br>
    Save & Smile par factory direct wholesale rates faraham kiye jaate hain.<br>
    Agar aap 1 carton ya bulk stock lena chahte hain to direct WhatsApp helpline par rabta karein:<br>
    👉 <a href="https://wa.me/923162323616?text=Salam!%20I%20want%20to%20buy%20in%20wholesale" target="_blank" style="color: #007382; font-weight: 700; text-decoration: underline;">0316-2323616</a>`;
  }

  // 4. Return, Replacement & Warranty
  if (q.includes('return') || q.includes('replace') || q.includes('warranty') || q.includes('kharaab') || q.includes('damage') || q.includes('wapsi')) {
    return `🛡️ <strong>7 Days Replacement Guarantee:</strong><br><br>
    Hamari tamam products par <strong>7 Days Checking & Replacement Warranty</strong> mojud hai.<br>
    Agar parcel mein koi issue ho to parcel open karne ki short video banayein aur WhatsApp helpline <strong>0316-2323616</strong> par send karein، hamari team foran replacement bhejegi.`;
  }

  // 5. Order Tracking
  if (q.includes('track') || q.includes('status') || q.includes('mera order') || q.includes('kahan he')) {
    return `📍 <strong>Order Tracking:</strong><br><br>
    Aap apna order hamare <a href="track-order.html" style="color: #007382; font-weight: 700; text-decoration: underline;">Track Order Page</a> par ja kar Order ID (e.g. SS-123456) ya Mobile Number daal kar live track kar sakte hain!`;
  }

  // 6. Greetings
  if (q.includes('salam') || q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('aoa')) {
    return `Walaykum Assalam! 😊 Welcome to Save & Smile Wholesale.<br><br>
    Main aap ka AI Smart Assistant hoon. Aap mujh se kisi bhi product, wholesale rate, delivery, EasyPaisa / Bank payment ya order tracking k baray mein pooch sakte hain. Main aap ki kya madad karoon?`;
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
      let prodList = matched.map(p => `• <strong>${p.title}</strong> — Rs. ${Number(p.price).toLocaleString()} <a href="product-detail.html?id=${p.id}" style="color: #007382; font-weight: 700; text-decoration: underline;">[View Product]</a>`).join('<br>');
      return `✨ <strong>Aap ki pasandeeda products dastiyab hain:</strong><br><br>${prodList}<br><br>Aap inhein direct website se "Order Now" kar sakte hain ya WhatsApp par rabta kar sakte hain!`;
    }
  }

  // 8. General / Helpful Fallback
  return `🤖 Shukriya aap k sawal ka!<br><br>
  Save & Smile Pakistan ka top wholesale store hai. Aap cash on delivery ya <strong>EasyPaisa (03337221552)</strong> aur <strong>Faysal Bank (Account: 3516390000005787)</strong> se payment kar sakte hain.<br><br>
  Mazeed rehnumai ya bulk order k liye hamare WhatsApp <strong>0316-2323616</strong> par rabta karein!`;
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
