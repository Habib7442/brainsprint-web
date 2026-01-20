
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_API_KEY is not set" }, { status: 500 });
  }

  try {
    const { topic, subject, count, pdfBase64 } = await req.json();

    let promptText = `
      Generate ${count || 20} ${subject || 'reasoning'} questions on the topic '${topic || 'General'}' for competitive exams.
      Target Level: **SSC CGL, SSC CHSL, RRB JE, RRB NTPC** (Prioritize these patterns heavily), IBPS PO, SBI Clerk. 
      
      ## Guidelines:
      1. **High Quality**: Questions must be logical, tricky, and free of errors.
      2. **Verified Correctness**: Double-check the answer key and explanation. The explanation must logically lead to the correct option.
      3. **Exam Pattern**: Follow the exact style and complexity of the mentioned exams.
      4. **Distinct Options**: Ensure all 4 options are distinct and plausible.
      5. **Math Formatting**: ALWAYS use LaTeX format with '$' delimiters for any mathematical expression (e.g., $x^2$, $3^{21}$, $\sqrt{4}$, $\pi$). Never use plain text for math.
      
      The difficulty should increase step-by-step:
      - First 30% questions: Easy (Foundation/Clerk level)
      - Middle 40% questions: Medium (PO/SSC CGL level)
      - Last 30% questions: Hard (Mains/Advanced level)
  
      Each question must be unique and not repeated.
      Ensure strict JSON output.
      
      The output must closely follow this schema:
      [
        {
          "id": "unique_string",
          "question": "Question text here (include any necessary instructions/diagram description)",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "The correct option string exactly matching one of the options",
          "explanation": "Step-by-step solution in numbered points. Each step should be on a new line. Format: 1. First step\\n2. Second step\\n3. Final answer",
          "difficulty": "Easy" | "Medium" | "Hard",
          "topic": "${topic}"
        }
      ]
    `;
  
    if (pdfBase64) {
        promptText = `
          Analyze the provided PDF document and generate ${count || 20} multiple-choice questions (MCQs) based on its content.
          Topic/Focus: ${topic || 'General Content of the Document'}.
          
          ## Guidelines:
          1. **Strictly Document Based**: Questions must be answerable ONLY from the provided PDF content.
          2. **Natural Phrasing**: DO NOT start questions with "According to the document," "As per the PDF," or similar phrases. Make the question feel like a direct exam question.
          3. **Reasoning & Comprehension**: Focus on logic, inference, and data interpretation from the document.
          4. **Format**: Same JSON schema as below.
          
          The output must closely follow this schema:
          [
            {
              "id": "unique_string",
              "question": "Question text here",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "The correct option string",
              "explanation": "Step-by-step solution in numbered points. Each step should be on a new line. Reference the relevant section/page of the PDF. Format: 1. First step\\n2. Second step\\n3. Final answer",
              "difficulty": "Easy" | "Medium" | "Hard",
              "topic": "${topic}"
            }
          ]
        `;
    }
  
    const contents: any[] = pdfBase64 
      ? [
          { text: promptText },
          {
              inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBase64
              }
          }
        ]
      : [{ text: promptText }];
  
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", 
      contents: contents, 
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              question: { type: "STRING" },
              options: { 
                type: "ARRAY",
                items: { type: "STRING" }
              },
              correctAnswer: { type: "STRING" },
              explanation: { type: "STRING" },
              difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
              topic: { type: "STRING" }
            },
            required: ["id", "question", "options", "correctAnswer", "explanation", "difficulty", "topic"]
          }
        }
      }
    });

    const responseText = response.text;
    
    if (!responseText) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
    }

    const questions = JSON.parse(responseText);
    
    // Add fallback IDs if missing
    const content = questions.map((q: any, index: number) => ({
      ...q,
      id: q.id || `q-${index}-${Date.now()}`
    }));

    return NextResponse.json(content);

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
