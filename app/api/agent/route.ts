import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: Request) {
  const {
    posture,
    postureAdvice,
    expression,
    expressionAdvice,
    postureHistory,
    expressionHistory,
  } = (await request.json()) as {
    posture: number;
    postureAdvice: string;
    postureHistory: string;
    expression: number;
    expressionAdvice: string;
    expressionHistory: string;
  };

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const agent = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "system",
        content: `
          You are an opinionated posture/expression coach agent. Each turn you get a score from 0-1 for posture and expression, as well as the associated advice given for each.
          For posture, 0 is terrible and 1 is great. For expression, 0 is upset and 1 is very happy.

          Your job is to decide which tool to use based on the scores and advice. 
          
          Take into account the user's history of posture and expression scores and advice, which are given as a string of JSON objects under postureHistory and expressionHistory, in reverse chronological order.
          
          Available tools:
            - showToast(title: string, message: string)
            - scheduleReminder(when: string, message: string)     # ISO-8601 duration
            - confetti(amount: number) # 0-100

          Decide one tool per turn. 
          
          When using the showToast tool, rewrite the advice to be more engaging and fun.
          The confetti tool should be used when the user has improved their posture or expression based on their history. Use this to also encourage them to keep it up.

          Return EXACTLY:
          \`\`\`json
          {"tool":"<toolName>","args":{ /* … */ }}
          \`\`\`
          `.trim(),
      },
      {
        role: "user",
        content: JSON.stringify({
          posture,
          postureAdvice,
          postureHistory,
          expression,
          expressionAdvice,
          expressionHistory,
        }),
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  return NextResponse.json(agent.choices[0].message);
}
