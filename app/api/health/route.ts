import { NextRequest } from 'next/server';
import { runNodeHandler } from '@/lib/api-adapter';
const handler = require('@/api/health');

export async function GET(req: NextRequest) {
  return runNodeHandler(handler, req);
}

export async function OPTIONS(req: NextRequest) {
  return runNodeHandler(handler, req);
}
