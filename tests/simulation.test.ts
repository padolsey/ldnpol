import { generatePolicyResponseStream } from
  '@/app/policy_simulator/main';

// TODO: get this running

describe('generatePolicyResponseStream', () => {
  const mockPersona = "25-year-old student living in East London";
  const mockPolicy = "Increase funding for public transportation";

  test('returns an AsyncGenerator', async () => {
    const generator = generatePolicyResponseStream(mockPersona, mockPolicy);
    expect(generator[Symbol.asyncIterator]).toBeDefined();
  });

  test('yields dataInsights as the first item', async () => {
    const generator = generatePolicyResponseStream(mockPersona, mockPolicy);
    const { value } = await generator.next();
    expect(value).toMatch(/<dataInsights>.+<\/dataInsights>/);
  });

  test('processes and yields correct fields', async () => {
    const generator = generatePolicyResponseStream(mockPersona, mockPolicy);
    let allContent = '';
    for await (const chunk of generator) {
      allContent += chunk;
    }
    expect(allContent).toContain('<p>');
    expect(allContent).toContain('<code class="support"');
    expect(allContent).not.toContain('Pros and Positive');
    expect(allContent).not.toContain('Cons and Negatives');
  });
});