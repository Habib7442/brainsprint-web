import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { stats } = await req.json();
    console.log("Received Stats for Analysis:", JSON.stringify(stats, null, 2));

    const prompt = `
      You are an elite competitive exam coach (Brainsprint AI). 
      Analyze the following student performance stats and generate a hyper-personalized 3-Day Improvement Plan.

      STUDENT STATS:
      ${JSON.stringify(stats, null, 2)}

      RULES:
      1. Identify "Weak Areas" (Low accuracy < 60%).
      2. Identify "Slow Areas" (High time per question > 1.5 min).
      3. Identify "Strong Areas" (High accuracy > 85%).
      4. Generate a specific "Daily Plan" for 3 Days.
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "analysis": {
          "weak_topics": ["Topic A", "Topic B"],
          "slow_topics": ["Topic C"],
          "careless_topics": ["Topic D"] 
        },
        "plan": [
          {
            "day": "Day 1",
            "focus": "Speed & Accuracy",
            "tasks": [
              "20 questions: [Weak Topic]",
              "10 questions: [Strong Topic] (Speed Drills)",
              "Review formulas for [Slow Topic]"
            ]
          },
          ... (Day 2, Day 3)
        ],
        "coach_note": "A brief, punchy motivational summary (max 2 sentences)."
      }

      Do not output markdown code blocks. Just the raw JSON string.
    `;

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    // The SDK typically returns data or text directly or via response
    const data: any = result;
    const text = data?.response?.candidates?.[0]?.content?.parts?.[0]?.text || 
                 data?.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                 "{}";
    
    console.log("Gemini Raw Response:", text);
    
    // Clean potential markdown just in case
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return NextResponse.json(JSON.parse(cleanedText));

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 });
  }
}
