import { NextRequest, NextResponse } from 'next/server';
import { getTokensByTheme } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const theme = searchParams.get('theme') || '';
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

  const tokens = await getTokensByTheme(theme, limit);
  return NextResponse.json({ tokens });
}
