import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(): Promise<Response> {
  const handler = require('@/lib/api/categories');
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
    const handler = require('@/lib/api/categories');
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
    const handler = require('@/lib/api/categories');
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
  return POST(req);
}

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const handler = require('@/lib/api/categories');
    let body = {};
    try { body = await req.json(); } catch (e) {}

    return await new Promise<Response>((resolve) => {
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
