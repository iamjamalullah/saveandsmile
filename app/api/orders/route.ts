import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const handler = require('@/lib/legacy-api/orders');
    return await new Promise<Response>((resolve) => {
      const mockReq = {
        method: 'GET',
        url: req.url,
        query: Object.fromEntries(req.nextUrl.searchParams),
        headers: Object.fromEntries(req.headers)
      };
      const mockRes = {
        setHeader: () => {},
        status: (code: number) => ({
          json: (data: any) => resolve(NextResponse.json(data, { status: code })),
          end: () => resolve(new NextResponse(null, { status: code }))
        })
      };
      handler(mockReq, mockRes);
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { isWooConfigured, createWooOrder } = await import('@/lib/woocommerce');

    if (isWooConfigured()) {
      const custName = body.customerName || body.customer?.name || 'Customer';
      const custPhone = body.customerPhone || body.customer?.phone || '';
      const custAddress = body.customerAddress || body.customer?.address || '';
      const custCity = body.customerCity || body.customer?.city || 'Karachi';
      const orderItems = body.items || [];

      const shippingCost = Number(body.shippingFee ?? body.shipping ?? 0);

      const wooPayload = {
        payment_method: (body.paymentMethod || 'cod').toLowerCase(),
        payment_method_title: (body.paymentMethod || 'cod').toUpperCase() === 'COD' ? 'Cash on Delivery' : 'Direct Payment',
        set_paid: false,
        billing: {
          first_name: custName,
          address_1: custAddress,
          city: custCity,
          phone: custPhone
        },
        shipping: {
          first_name: custName,
          address_1: custAddress,
          city: custCity,
          phone: custPhone
        },
        line_items: orderItems.map((item: any) => {
          const qty = Math.max(1, parseInt(item.qty, 10) || 1);
          const price = parseFloat(item.price) || 0;
          const lineTotal = (price * qty).toFixed(2);
          const isNumericId = !isNaN(Number(item.id)) && Number(item.id) > 0 && Number(item.id) < 100000;
          
          return {
            name: item.title || item.name || 'Store Product',
            ...(isNumericId ? { product_id: Number(item.id) } : {}),
            quantity: qty,
            subtotal: lineTotal,
            total: lineTotal
          };
        }),
        shipping_lines: shippingCost > 0 ? [
          {
            method_id: 'flat_rate',
            method_title: 'Nationwide Delivery',
            total: shippingCost.toFixed(2)
          }
        ] : [],
        customer_note: body.notes || body.customer?.notes || ''
      };

      const wooResult = await createWooOrder(wooPayload);
      if (wooResult && wooResult.id) {
        return NextResponse.json({
          success: true,
          orderId: `WC-${wooResult.id}`,
          orderNumber: wooResult.number || wooResult.id,
          grandTotal: parseFloat(wooResult.total) || body.grandTotal,
          status: wooResult.status || 'processing',
          source: 'woocommerce',
          message: 'Order created in WooCommerce successfully!'
        }, { status: 201 });
      }
    }

    const handler = require('@/lib/legacy-api/orders');
    return await new Promise<Response>((resolve) => {
      const mockReq = {
        method: 'POST',
        url: req.url,
        body,
        query: Object.fromEntries(req.nextUrl.searchParams),
        headers: Object.fromEntries(req.headers)
      };
      const mockRes = {
        setHeader: () => {},
        status: (code: number) => ({
          json: (data: any) => resolve(NextResponse.json(data, { status: code })),
          end: () => resolve(new NextResponse(null, { status: code }))
        })
      };
      handler(mockReq, mockRes);
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const handler = require('@/lib/legacy-api/orders');
    return await new Promise<Response>((resolve) => {
      const mockReq = {
        method: 'PUT',
        url: req.url,
        body,
        query: Object.fromEntries(req.nextUrl.searchParams),
        headers: Object.fromEntries(req.headers)
      };
      const mockRes = {
        setHeader: () => {},
        status: (code: number) => ({
          json: (data: any) => resolve(NextResponse.json(data, { status: code })),
          end: () => resolve(new NextResponse(null, { status: code }))
        })
      };
      handler(mockReq, mockRes);
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
