import { neon } from '@neondatabase/serverless';

export async function onRequestGet(context) {
  const dbUrl = context.env.DATABASE_URL;

  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      const rows = await sql`SELECT * FROM products ORDER BY id ASC`;
      return new Response(JSON.stringify({ source: 'neon-cloudflare', count: rows.length, products: rows }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (err) {
      console.error('Neon Cloudflare error:', err);
    }
  }

  // Fallback if DATABASE_URL not set in Cloudflare environment
  return new Response(JSON.stringify({ source: 'fallback', products: [] }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost(context) {
  const dbUrl = context.env.DATABASE_URL;
  if (!dbUrl) {
    return new Response(JSON.stringify({ error: 'DATABASE_URL not configured' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await context.request.json();
    const { title, description, code, category, tab, price, originalPrice, badge, image, stock } = body;
    const sql = neon(dbUrl);

    const result = await sql`
      INSERT INTO products (title, description, code, category, tab, price, original_price, badge, image, stock)
      VALUES (${title}, ${description || ''}, ${code || ''}, ${category || 'storage'}, ${tab || 'storage'}, ${price}, ${originalPrice || null}, ${badge || 'NEW'}, ${image}, ${stock || 100})
      RETURNING *
    `;

    return new Response(JSON.stringify({ success: true, product: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
