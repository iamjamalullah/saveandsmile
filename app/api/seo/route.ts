import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const handler = require('@/api/seo');
    return await new Promise<Response>((resolve) => {
      const mockReq = {
        method: 'GET',
        url: req.url,
        query: Object.fromEntries(req.nextUrl.searchParams),
        headers: Object.fromEntries(req.headers)
      };
      const mockRes = {
        setHeader: (key: string, val: string) => {},
        status: (code: number) => ({
          send: (data: any) => resolve(new NextResponse(data, {
            status: code,
            headers: { 'Content-Type': req.nextUrl.searchParams.get('type') === 'sitemap' ? 'application/xml' : 'text/plain' }
          })),
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
