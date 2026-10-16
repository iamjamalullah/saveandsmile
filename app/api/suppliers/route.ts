import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest): Promise<Response> {
  const handler = require('@/lib/api/suppliers');
  return new Promise<Response>((resolve) => {
    const mockReq = { method: 'GET', url: req.url, query: Object.fromEntries(req.nextUrl.searchParams), headers: Object.fromEntries(req.headers) };
    const mockRes = {
      setHeader: () => {},
      status: (code: number) => ({
        json: (data: any) => resolve(NextResponse.json(data, { status: code })),
        end: () => resolve(new NextResponse(null, { status: code }))
      })
    };
    handler(mockReq, mockRes);
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const handler = require('@/lib/api/suppliers');
    return new Promise<Response>((resolve) => {
      const mockReq = { method: 'POST', url: req.url, body, query: Object.fromEntries(req.nextUrl.searchParams), headers: Object.fromEntries(req.headers) };
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const handler = require('@/lib/api/suppliers');
    return new Promise<Response>((resolve) => {
      const mockReq = { method: 'PUT', url: req.url, body, query: Object.fromEntries(req.nextUrl.searchParams), headers: Object.fromEntries(req.headers) };
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const handler = require('@/lib/api/suppliers');
    return new Promise<Response>((resolve) => {
      const mockReq = { method: 'DELETE', url: req.url, body, query: Object.fromEntries(req.nextUrl.searchParams), headers: Object.fromEntries(req.headers) };
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
