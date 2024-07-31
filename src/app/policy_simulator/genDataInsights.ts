import {
  census2021Data,
  youGovData
} from './data';
import { makeLLMStreamRequest, makeLLMRequest } from './llm';

const SYSTEM_PROMPT = () => `
You are a political/urban/social data analyst program that extracts meaningful and accurate data from a data-dump of various CSVs relevant to the London and Greater London constituencies. The data is as follows:

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

You will be given multiple <persona> entries (of constituents within London) and a <policy> (proposed by a policymaker). You must find data that is relevant to the personas and policy to help inform downstream policy-making decisions. Your data is raw, used by other programs, not read by humans.

Provide your insights as a markdown list. Do not hallucinate or confabulate. Be objective. Only use the quantitative data you have available.
`.trim();

const INSIGHTS_PROMPT = ({
  personas,
  policy
}: {
  personas: string[],
  policy: string
}) => `
${personas.map((persona, index) => `<persona${index + 1}>${persona}</persona${index + 1}>`).join('\n')}
<policy>${policy}</policy>

Analyze the data considering all provided personas. Be concise and specific. Limit your response to 8 key insights, formatted as a markdown list. Begin immediately with the first item.

Ensure the items, altogether, are useful in analyzing how the policy affects the various personas. But do not be subjective. Give quantitative data only.
`.trim();

export default async function genDataInsights(
  personas: string[],
  policy: string
): Promise<string> {
  const response = await makeLLMRequest(
    SYSTEM_PROMPT(),
    INSIGHTS_PROMPT({ personas, policy }),
    {
      max_tokens: 600
    }
  );
  console.log('Data Insight Response', response);
  return response;
}