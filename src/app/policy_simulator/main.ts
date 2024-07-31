import TagStreamProcessor from '@/app/utils/TagStreamProcessor';
import { makeLLMStreamRequest, makeLLMRequest } from './llm';

import {
  census2021Data,
  youGovData
} from './data';

function escapeHtml(unsafe: string): string {
  return unsafe
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#039;");
}

const LOADING_CHARACTER = '\uE081';

const SYSTEM_PROMPT = () => `
You are a political/urban/social analyst who can simulate narratives and opinions of various demographics in London, UK, in order to inform policy-making. You will be given a <persona> and a <policy>. And using the <DATA> specified here, you will output a possible simulated response to the policy from a citizen who aligns most with that persona, even if the response is negative.

<DATA from="YouGov polls">
  ${youGovData}
</DATA>

${
  Object.entries(census2021Data).map(
    ([name, csv]) => `
      <DATA from="Census 2021: ${name}">
      ${csv}
      </DATA>
    `
  )
}

Your output is one response declared with various fields:

\`\`\`
Œ<field name="Pros and Positives">{possible positives from the policy purely from the perspective of the persona}</field>
Œ<field name="Cons and Negatives">{possible negatives from the policy purely from the perspective of the persona}</field>
Œ<field name="Human Statement">{Short opinion or statement expressed in human terms as if from the persona [DO NOT EMPLOY VERNACULAR; IT IS PATRONIZING; JUST SPEAK NORMALLY IN HUMAN TERMS]}</field>
Œ<field name="Support Likelihood">n%</field>
\`\`\`

Always use 'Œ' to mark the each '<field>'. Every field is demarkated like XML, with an opening tag like '<field>' and a closing tag '</field>'
RULES:

(1) Do not create cliches or use stereotypes; try to only use the data.
(2) Use the data to drive the reaction. It is possible that citizens might be in support, partially in support, apathetic, or not in support of the policy.
(3) Use simple but normal British English in your hypothetical human 'opinion' prose.

`.trim();

const USER_PROMPT = ({
  persona,
  policy,
  dataInsights
}: {
  persona: string,
  policy: string,
  dataInsights: string
}) => `<persona>${persona}</persona>
<policy>${policy}</policy>

<pre_analyzed_data_insights>
${dataInsights}
</pre_analyzed_data_insights>

Provide 1 response, with pros, cons, a statement, and the support_likelihood percentage. Do NOT provide _anything_ else.
`.trim();

export async function generatePolicyResponse(
  persona: string,
  policy: string,
  dataInsights: string
): Promise<string> {
    console.log('Simulating policy response', {
        persona, policy, dataInsights
    });
    
    const response = await makeLLMRequest(
      SYSTEM_PROMPT(),
      USER_PROMPT({
        persona, policy, dataInsights
      })
    );
    return response;
}

export async function* generatePolicyResponseStream(
  persona: string,
  policy: string,
  dataInsights: string
): AsyncGenerator<string, void, unknown> {
  const stream = makeLLMStreamRequest(
    SYSTEM_PROMPT(),
    USER_PROMPT({
      persona,
      policy,
      dataInsights
    })
  );

  const processor = new TagStreamProcessor(
    'Œ',
    'Œ',
    '</field>',
    LOADING_CHARACTER,
    async (contents) => {
      return contents.replace(/<field.+?name="(.+?)">([\s\S]+?)(?=<\/field|$)/g, ($0, $name, $content) => {
        if (/pros|cons/i.test($name)) {
          // We don't actually want to display these;
          // they're only used for LLM chain of thought
          return LOADING_CHARACTER;
        }
        if (/Likelihood/i.test($name)) {
          return `<code
            class="support"
            style="
              background: ${
                getColorForPercentage(
                  Number($content.match(/(\d+)/)?.[1]||0)
                )
              };
            ">${$content}</code>`
        }
        return `<p>${escapeHtml($content).trim()}</p>`;
      });
    },
    {
      // discardAfterEndTag: true
    }
  );

  let buffer = '';
  for await (const chunk of stream) {
    buffer += chunk;
    const processed = await processor.next(buffer);
    if (processed) {
      yield processed;
      buffer = '';
    }
  }

  // Process any remaining content in the buffer
  if (buffer) {
    const processed = await processor.next(buffer);
    if (processed) {
      yield processed;
    }
  }
}

function getColorForPercentage(percentage: number): string {
  const hue = (percentage * 120) / 100;
  return `hsl(${hue}, 100%, 40%)`;
}