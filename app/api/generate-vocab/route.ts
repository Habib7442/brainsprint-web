
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const apiKey = process.env.GOOGLE_API_KEY;

const vocabSchema = z.array(z.object({
  word: z.string(),
  question: z.string(),
  options: z.array(z.string()).length(4),
  answer: z.string(),
  hint: z.string().optional()
}));

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GOOGLE_API_KEY" }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Optional: User can request specific difficulty or topic
    const { difficulty = "advanced" } = await req.json().catch(() => ({}));

    const prompt = `Generate 10 vocabulary multiple-choice questions suitable for competitive exams like SSC CGL and IBPS Banking.
    Difficulty should be ${difficulty}.
    Focus on high-frequency words, synonyms, antonyms, one-word substitutions, or idioms common in these exams.
    Provide 4 options for each.
    Ensure strict JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(vocabSchema as any),
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response from AI");
    }

    const questions = JSON.parse(text);
    return NextResponse.json({ questions });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
