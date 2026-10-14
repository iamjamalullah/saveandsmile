import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(): Promise<Response> {
  const handler = require('@/lib/api/analytics');
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
    const handler = require('@/lib/api/analytics');
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
