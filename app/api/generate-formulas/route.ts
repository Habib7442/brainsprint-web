
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

    const seed = Date.now().toString(36);
    const promptText = `
      Generate ${count || 25} formula completion questions for the chapter '${chapter || 'All Chapters'}' in Mathematics (Quant/Competitive Exams).
      Random Seed: ${seed}
      
      ## Guidelines:
      1. **Variety**: Focus on different formulas within the chapter. Do not repeat the same question structure.
      2. **Strict Math Formatting**: ALWAYS wrap ALL mathematical expressions (formulaHead, template, correctPart, and options) in '$' delimiters. 
         - Example: "$A = $" and "$\\pi \\times [?]$"
      3. **LaTeX Integrity**: Ensure the 'template' remains valid LaTeX even with the '[?]' placeholder. 
         - AVOID putting '[?]' inside complex LaTeX commands if it breaks them. 
         - For fractions, use: $\\text{sin}(\\theta) / [?]$ OR $\\frac{\\text{sin}(\\theta)}{X} \\text{ where } X = [?]$ if needed, but preferable to keep it simple.
      4. **formulaHead**: The start/name of the formula.
      5. **template**: The formula with ONE '[?]' placeholder.
      6. **correctPart**: The exact value for '[?]'.
      
      Chapters can include: Mensuration, Trigonometry, Algebra, Geometry, Arithmetic.
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
