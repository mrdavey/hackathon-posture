import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: Request) {
  const { image } = (await request.json()) as { image: string };
  const imgData = image.replace(/^data:image\/.+;base64,/, "");

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const completion = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "system",
        content: `You are a posture-analysis assistant. You will recieve a webcam image of a user facing their laptop webcam.
        Your task is to analyze the user's posture and provide feedback. If they are in a neutral or good posture, encourage them to keep it up. If they are in a poor or terrible posture, provide advice on how to improve it.
        Keep your advice short and to the point. Use emojis to make it more engaging.

          Return EXACT JSON: {posture: great|good|poor|terrible, confidence:0-1, advice:string}.`,
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

  const result = completion.choices[0].message as unknown as {
    posture: "great" | "good" | "poor" | "terrible";
    confidence: number;
    advice: string;
  };

  const notify = true;

  return NextResponse.json({ notify, ...result });
}
