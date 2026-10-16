import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatency = 0;

  try {
    const { getDb } = require('@/lib/api/db');
    const sql = getDb();
    if (sql) {
      const dbStart = Date.now();
      await sql`SELECT 1 as ping`;
      dbLatency = Date.now() - dbStart;
      dbStatus = 'connected';
    }
  } catch (err: any) {
    dbStatus = 'fallback_local_json';
  }

  // Check data files
  const dataDir = path.join(process.cwd(), 'data');
  const productsFile = path.join(process.cwd(), 'products.json');
  let productsCount = 0;
  let ordersCount = 0;

  try {
    if (fs.existsSync(productsFile)) {
      const prods = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
      if (Array.isArray(prods)) productsCount = prods.length;
    }
    const ordersPath = path.join(dataDir, 'orders.json');
    if (fs.existsSync(ordersPath)) {
      const ords = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      if (Array.isArray(ords)) ordersCount = ords.length;
    }
  } catch (e) {}

  const totalLatency = Date.now() - startTime;

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Save & Smile Wholesale E-Commerce Engine',
    version: '2.5.0-production',
    nodeEnv: process.env.NODE_ENV || 'production',
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatency
    },
    storage: {
      dataDirExists: fs.existsSync(dataDir),
      productsCount,
      ordersCount,
      uploadsDirExists: fs.existsSync(path.join(process.cwd(), 'public', 'uploads'))
    },
    totalLatencyMs: totalLatency
  });
}
