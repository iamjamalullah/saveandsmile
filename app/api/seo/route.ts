import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(): Promise<Response> {
  const handler = require('@/lib/api/seo');
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
    const handler = require('@/lib/api/seo');
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
          end: (data?: any) => resolve(new NextResponse(data || null, {
            status: code,
            headers: req.nextUrl.searchParams.get('type') === 'sitemap'
              ? { 'Content-Type': 'application/xml; charset=utf-8' }
              : req.nextUrl.searchParams.get('type') === 'robots'
              ? { 'Content-Type': 'text/plain; charset=utf-8' }
              : { 'Content-Type': 'text/plain' }
          }))
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
    const handler = require('@/lib/api/seo');
    const res = await new Promise<Response>((resolve) => {
      const mockReq = {
        method: 'POST',
        url: req.url,
        body,
        query: Object.fromEntries(req.nextUrl.searchParams),
        headers: Object.fromEntries(req.headers)
      };
      const mockRes = {
        setHeader: (key: string, val: string) => {},
        status: (code: number) => ({
          json: (data: any) => resolve(NextResponse.json(data, { status: code })),
          end: (data?: any) => resolve(new NextResponse(data || null, { status: code }))
        })
      };
      handler(mockReq, mockRes);
    });

    if (res.status >= 200 && res.status < 300) {
      try {
        revalidatePath('/', 'layout');
        revalidatePath('/');
        revalidatePath('/product-detail');
      } catch (e) {}
    }
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
