import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function OPTIONS(): Promise<Response> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const handler = require('@/lib/api/chat');
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
