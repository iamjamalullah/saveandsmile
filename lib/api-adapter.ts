import { NextRequest, NextResponse } from 'next/server';

export async function runNodeHandler(handler: any, req: NextRequest) {
  let statusCode = 200;
  let responseData: any = null;
  const responseHeaders = new Headers();

  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key.toLowerCase()] = value;
  });

  const url = new URL(req.url);
  const queryObj: Record<string, string> = {};
  url.searchParams.forEach((val, key) => {
    queryObj[key] = val;
  });

  let body: any = null;
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    try {
      body = await req.json();
    } catch (e) {
      body = null;
    }
  }

  const mockReq: any = {
    method: req.method,
    headers: headersObj,
    query: queryObj,
    body: body,
    url: req.url,
  };

  const mockRes: any = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      responseHeaders.set(name, value);
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
    send(data: any) {
      responseData = data;
      return this;
    },
    end(data?: any) {
      if (data) responseData = data;
      return this;
    },
  };

  try {
    await handler(mockReq, mockRes);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }

  if (typeof responseData === 'object' && responseData !== null && !responseHeaders.has('content-type')) {
    return NextResponse.json(responseData, { status: statusCode, headers: responseHeaders });
  }

  return new NextResponse(responseData ?? '', { status: statusCode, headers: responseHeaders });
}
