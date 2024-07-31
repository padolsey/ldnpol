import { NextRequest } from 'next/server';
import genDataInsights from '@/app/policy_simulator/genDataInsights';

export async function POST(request: NextRequest) {
  const { policy, personas } = await request.json();
  if (!policy || !personas?.length) {
    return new Response('Policy and personas are required', { status: 400 });
  }

  try {
    const dataInsights = await genDataInsights(personas, policy);
    return new Response(JSON.stringify({ dataInsights }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating data insights:', error);
    return new Response('Error generating data insights', { status: 500 });
  }
}