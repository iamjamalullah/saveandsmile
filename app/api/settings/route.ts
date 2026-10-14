import { NextRequest } from 'next/server';
const handler = require('@/lib/api/settings');

export const dynamic = 'force-dynamic';

function adaptResponse(resHelper: any) {
  return new Response(JSON.stringify(resHelper.data), {
    status: resHelper.statusCode,
    headers: resHelper.headers
  });
}

function createMocks(req: NextRequest, body?: any) {
  const origin = req.headers.get('origin') || '*';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true'
  };

  const reqHelper = {
    method: req.method,
    headers: {
      authorization: req.headers.get('authorization') || '',
      origin
    },
    query: Object.fromEntries(req.nextUrl.searchParams),
    body
  };

  const resHelper = {
    statusCode: 200,
    headers,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.data = data;
      return this;
    },
    end() {
      return this;
    },
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    }
  };

  return { reqHelper, resHelper };
}

export async function OPTIONS(req: NextRequest) {
  const { reqHelper, resHelper } = createMocks(req);
  await handler(reqHelper, resHelper);
  return adaptResponse(resHelper);
}

export async function GET(req: NextRequest) {
  const { reqHelper, resHelper } = createMocks(req);
  await handler(reqHelper, resHelper);
  return adaptResponse(resHelper);
}

export async function POST(req: NextRequest) {
  let body = {};
  try { body = await req.json(); } catch (e) {}
  const { reqHelper, resHelper } = createMocks(req, body);
  await handler(reqHelper, resHelper);
  return adaptResponse(resHelper);
}

export async function PUT(req: NextRequest) {
  let body = {};
  try { body = await req.json(); } catch (e) {}
  const { reqHelper, resHelper } = createMocks(req, body);
  await handler(reqHelper, resHelper);
  return adaptResponse(resHelper);
}
