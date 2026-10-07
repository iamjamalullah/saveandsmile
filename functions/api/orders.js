import { neon } from '@neondatabase/serverless';

export async function onRequestPost(context) {
  const dbUrl = context.env.DATABASE_URL;

  try {
    const body = await context.request.json();
    const {
      orderId,
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      paymentMethod,
      subtotal,
      shippingFee,
      grandTotal,
      items,
      notes
    } = body;

    const orderCode = orderId || ('SS-' + Math.floor(100000 + Math.random() * 900000));

    if (dbUrl) {
      const sql = neon(dbUrl);
      const orderResult = await sql`
        INSERT INTO orders (
          order_code, customer_name, customer_phone, customer_address, customer_city,
          payment_method, subtotal, shipping_fee, grand_total, status, notes
        )
        VALUES (
          ${orderCode}, ${customerName || 'Customer'}, ${customerPhone || ''}, ${customerAddress || ''},
          ${customerCity || 'Karachi'}, ${paymentMethod || 'COD'}, ${subtotal || 0}, ${shippingFee || 0},
          ${grandTotal || 0}, 'Pending', ${notes || ''}
        )
        RETURNING *
      `;

      const createdOrder = orderResult[0];

      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await sql`
            INSERT INTO order_items (order_id, product_id, title, price, qty, total)
            VALUES (
              ${createdOrder.id}, ${item.id || null}, ${item.title || 'Item'},
              ${item.price || 0}, ${item.qty || 1}, ${(item.price || 0) * (item.qty || 1)}
            )
          `;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        orderId: orderCode,
        order: createdOrder,
        message: 'Order saved to Neon PostgreSQL via Cloudflare Pages!'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      orderId: orderCode,
      message: 'Order saved locally (Offline mode)'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestGet(context) {
  const dbUrl = context.env.DATABASE_URL;
  if (!dbUrl) {
    return new Response(JSON.stringify({ orders: [], message: 'DATABASE_URL not set' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const sql = neon(dbUrl);
    const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 50`;
    return new Response(JSON.stringify({ orders }), {
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
