import { NextRequest } from 'next/server';
import { runNodeHandler } from '@/lib/api-adapter';
const handler = require('@/api/home-customization');

export async function GET(req: NextRequest) {
  return runNodeHandler(handler, req);
}

export async function POST(req: NextRequest) {
  return runNodeHandler(handler, req);
}

export async function OPTIONS(req: NextRequest) {
  return runNodeHandler(handler, req);
}
