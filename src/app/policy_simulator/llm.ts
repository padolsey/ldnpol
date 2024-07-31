import PQueue from 'p-queue';
import { RateLimiter } from 'limiter';
import { ReadableStream } from 'stream/web';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_REQUESTS_PER_MINUTE = 60;

console.log('Claude API key found', !!ANTHROPIC_API_KEY);
console.log('OpenAI API key found', !!OPENAI_API_KEY);

const queue = new PQueue({ concurrency: 6 });
const limiter = new RateLimiter({
  tokensPerInterval: MAX_REQUESTS_PER_MINUTE,
  interval: 'minute',
});

interface RequestConfig {
    system: string;
    prompt: string;
    configOverrides?: object;
    provider: 'anthropic' | 'openai';
}

function generateCacheKey(config: RequestConfig): string {
    const { system, prompt, configOverrides, provider } = config;
    const data = JSON.stringify({ system, prompt, configOverrides, provider });
    return crypto.createHash('md5').update(data).digest('hex');
}

async function getCachedResponse(cacheKey: string): Promise<string | null> {
    const cacheDir = path.join(process.cwd(), '_cache');
    const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    if (fs.existsSync(cacheFile)) {
        const cachedData = await fs.promises.readFile(cacheFile, 'utf-8');
        return JSON.parse(cachedData).response;
    }

    return null;
}

async function setCachedResponse(cacheKey: string, response: string): Promise<void> {
    const cacheDir = path.join(process.cwd(), '_cache');
    const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

    try {
        await fs.promises.writeFile(cacheFile, JSON.stringify({ response }), 'utf-8');
    } catch(e) {
        // For now we'll just log - it's not the end of the world
        console.error('Unwritable cache file', e);
    }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function exponentialBackoff(retryCount: number) {
  const delay = Math.pow(2, retryCount) * 3000; // exponential backoff
  await sleep(delay);
}

async function makeRequest(config: RequestConfig, isStream: boolean) {
    const cacheKey = generateCacheKey(config);
    const cachedResponse = await getCachedResponse(cacheKey);

    if (cachedResponse) {
        console.log('Using cached response');
        if (isStream) {
            return new Response(cachedResponse, {
                headers: { 'Content-Type': 'text/event-stream' }
            });
        } else {
            return new Response(JSON.stringify({ content: [{ text: cachedResponse }] }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return makeActualRequest(config, isStream, cacheKey);
}

async function makeActualRequest(config: RequestConfig, isStream: boolean, cacheKey: string, retryCount = 0) {
    try {
        await limiter.removeTokens(1);
        const { system, prompt, configOverrides = {}, provider } = config;
        if (!prompt || !system) {
            throw new Error('System and Prompt must be set');
        }

        const apiUrl = provider === 'anthropic' ? CLAUDE_API_URL : OPENAI_API_URL;
        const apiKey = provider === 'anthropic' ? ANTHROPIC_API_KEY : OPENAI_API_KEY;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (provider === 'anthropic') {
            if (apiKey) {
                headers['x-api-key'] = apiKey;
            }
            headers['anthropic-version'] = '2023-06-01';
        } else {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const bodyContent = provider === 'anthropic' 
            ? {
                model: 'claude-3-5-sonnet-20240620',
                system: system,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 400,
                stream: isStream,
                temperature: 0.5
            }
            : {
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 400,
                stream: isStream,
                temperature: 0.5
            };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                ...bodyContent,
                ...configOverrides
            }),
        });

        if (response.status === 429) {
            if (retryCount < 3) { // Max 3 retries
                console.log(`Rate limited. Retrying in ${Math.pow(2, retryCount)} seconds...`);
                await exponentialBackoff(retryCount);
                return makeActualRequest(config, isStream, cacheKey, retryCount + 1);
            } else {
                throw new Error('Max retries reached. Rate limit persists.');
            }
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (isStream) {
            const reader = (response as Response).body?.getReader();
            if (!reader) {
                throw new Error('Failed to get reader from response');
            }

            let fullResponse = '';
            const stream = new ReadableStream({
                async start(controller) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = new TextDecoder().decode(value);
                        fullResponse += chunk;
                        controller.enqueue(value);
                    }
                    controller.close();
                    await setCachedResponse(cacheKey, fullResponse);
                }
            });

            return new Response(
                stream as unknown as BodyInit,
                { headers: response.headers }
            );
        } else {
            const data = await response.json();
            const responseText = provider === 'anthropic' 
                ? data.content[0].text.trim()
                : data.choices[0].message.content.trim();
            await setCachedResponse(cacheKey, responseText);
            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('Error in makeActualRequest:', error);
        throw error;
    }
}

export async function makeLLMRequest(
    system: string = '',
    prompt: string = '',
    configOverrides: object = {},
    provider: 'anthropic' | 'openai' = 'anthropic'
): Promise<string> {
    return queue.add(async () => {
        try {
            const response = await makeRequest({ system, prompt, configOverrides, provider }, false);
            const data = await response.json();
            console.log(`${provider} response`, data);
            return provider === 'anthropic' 
                ? data.content[0].text.trim()
                : data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error in makeLLMRequest:', error);
            throw error;
        }
    });
}

export async function* makeLLMStreamRequest(
    system: string = '',
    prompt: string = '',
    configOverrides: object = {},
    provider: 'anthropic' | 'openai' = 'anthropic'
): AsyncGenerator<string, void, unknown> {
    try {
        const response = await queue.add(() => makeRequest({ system, prompt, configOverrides, provider }, true));
        const reader = (response as Response).body?.getReader();
        if (!reader) {
            throw new Error('Failed to get reader from response');
        }
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try { 
                        const data = JSON.parse(line.slice(6));
                        if (provider === 'anthropic' && data.type === 'content_block_delta') {
                            yield data.delta.text;
                        } else if (provider === 'openai' && data.choices?.[0]?.delta?.content) {
                            yield data.choices[0].delta.content;
                        }
                    } catch(e) {
                        console.error('Unparseable line?', line);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in makeLLMStreamRequest:', error);
        throw error;
    }
}