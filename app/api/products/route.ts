import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(): Promise<Response> {
  const handler = require('@/lib/api/products');
  return new Promise<Response>((resolve) => {
    const mockReq = { method: 'OPTIONS', headers: {} };
    const mockRes = {
      setHeader: () => {},
      status: (code: number) => ({
        end: () => resolve(new NextResponse(null, { status: code }))
      })
    };
    handler(mockReq, mockRes);
  });
}

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const handler = require('@/lib/api/products');
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
    const handler = require('@/lib/api/products');
    const res = await new Promise<Response>((resolve) => {
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
    if (res.status >= 200 && res.status < 300) {
      try {
        revalidatePath('/');
        revalidatePath('/product-detail');
      } catch (e) {}
    }
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const handler = require('@/lib/api/products');
    const res = await new Promise<Response>((resolve) => {
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
    if (res.status >= 200 && res.status < 300) {
      try {
        revalidatePath('/');
        revalidatePath('/product-detail');
      } catch (e) {}
    }
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const handler = require('@/lib/api/products');
    let body = {};
    try {
      body = await req.json();
    } catch (e) {}

    const res = await new Promise<Response>((resolve) => {
      const mockReq = {
        method: 'DELETE',
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
    if (res.status >= 200 && res.status < 300) {
      try {
        revalidatePath('/');
        revalidatePath('/product-detail');
      } catch (e) {}
    }
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
