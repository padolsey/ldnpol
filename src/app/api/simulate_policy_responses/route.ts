import { NextRequest } from 'next/server';
import { generatePolicyResponseStream } from '@/app/policy_simulator/main';

export async function POST(request: NextRequest) {
  const { policy, persona, dataInsights } = await request.json();
  
  if (!policy || !persona || !dataInsights) {
    return new Response('Policy, persona, and dataInsights are required', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of generatePolicyResponseStream(persona, policy, dataInsights)) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}