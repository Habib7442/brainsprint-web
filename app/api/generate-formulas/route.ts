
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_API_KEY is not set" }, { status: 500 });
  }

  try {
    const { chapter, count } = await req.json();

    const promptText = `
      Generate ${count || 10} formula completion questions for the chapter '${chapter || 'All Chapters'}' in Mathematics (Quant/Competitive Exams).
      Chapters can include: Mensuration, Trigonometry, Algebra, Geometry, Arithmetic.
      
      ## Format Rules:
      1. **formulaHead**: The start of the formula (e.g., "$Area of Circle =$")
      2. **template**: The formula with a [?] placeholder (e.g., "$\\pi \\times [?]$")
      3. **correctPart**: The exact string that replaces [?] (e.g., "$r^2$")
      4. **options**: 4 distinct options including the correctPart.
      5. **Math Formatting**: ALWAYS use LaTeX format with '$' delimiters. Use standard LaTeX symbols like \\pi, \\times, \\theta, etc. NEVER use raw unicode characters.
      6. **Difficulty**: Assign Easy, Medium, or Hard.
      
      Example:
      {
        "id": "f_001",
        "topic": "Quant Maths",
        "chapter": "Mensuration",
        "formulaHead": "Volume of Sphere =",
        "template": "$\\frac{4}{3} \\pi \\times [?]$",
        "correctPart": "$r^3$",
        "options": ["$r^2$", "$r^3$", "$3r$", "$\\pi r^2$"],
        "difficulty": "Medium"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              topic: { type: "STRING" },
              chapter: { type: "STRING" },
              formulaHead: { type: "STRING" },
              template: { type: "STRING" },
              correctPart: { type: "STRING" },
              options: { 
                type: "ARRAY",
                items: { type: "STRING" }
              },
              difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] }
            },
            required: ["id", "topic", "chapter", "formulaHead", "template", "correctPart", "options", "difficulty"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(responseText));

  } catch (error: any) {
    console.error("Formula Generation Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
