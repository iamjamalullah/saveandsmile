import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const handler = require('@/api/orders');
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
        line_items: orderItems.map((item: any) => ({
          product_id: item.id || item.code,
          quantity: item.qty || 1
        })),
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

    const handler = require('@/api/orders');
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
    const handler = require('@/api/orders');
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
