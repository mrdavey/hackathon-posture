import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: Request) {
  const { image } = (await request.json()) as { image: string };
  const imgData = image.replace(/^data:image\/.+;base64,/, "");
  1;
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const postureResp = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "system",
        content: `You are an opinionated posture-analysis assistant. You will recieve a webcam image of a user facing their laptop webcam.
        Your task is to analyze the user's posture and provide feedback. 
        If they are in a good posture, encourage them to keep it up. If they are in a poor or terrible posture, provide advice on how to improve it.
        Keep your advice short and to the point. Use emojis to make it more engaging.
        Score the posture on a scale of 0-1, where 0 is terrible and 1 is great.

        Return EXACT JSON: {posture: great|good|poor|terrible, confidence:0-1, advice:string, score:0-1}.`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Assess my posture." },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imgData}` },
          },
        ],
      },
    ],
    temperature: 0.0,
    response_format: { type: "json_object" },
  });

  const p = postureResp.choices[0].message;

  const notifyPosture = true;

  const exprResp = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "system",
        content: `You are an opinionated facial-emotion expert. You will receive a webcam image of a user facing their laptop webcam.
        Your task is to analyze the user's facial emotions and provide analysis. 
        If they are in a neutral or focused expression, encourage them to keep it up. If they are in an emotional expression, provide comforting advice or motivational quotes.
        Keep your advice short and to the point. Use emojis to make it more engaging.
        Score the expression on a scale of 0-1, where 0 is upset and 1 is very happy.
        Return JSON: { expression: emotional|focused|neutral, confidence: 0-1, advice: string, score: 0-1 }`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze my facial expression and give me a suggestion.",
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imgData}` },
          },
        ],
      },
    ],
    temperature: 0.0,
    response_format: { type: "json_object" },
  });
  const e = exprResp.choices[0].message;

  const notifyExpression = true;

  return NextResponse.json({
    notifyPosture,
    notifyExpression,
    posture: p.content,
    expression: e.content,
  });
}
