import { GoogleGenAI, Type } from "@google/genai";
import { 
  AGENT_1_SYSTEM_PROMPT, 
  AGENT_2_SYSTEM_PROMPT, 
  AGENT_3_SYSTEM_PROMPT, 
  AGENT_4_SYSTEM_PROMPT 
} from "../constants";
import { ClassifierResponse, AssessorResponse } from "../types";

// Helper to get API key safely
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

// Agent 1: Classification
export const runAgent1_Classifier = async (question: string): Promise<ClassifierResponse> => {
  const ai = getAIClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze this student question: "${question}"`,
    config: {
      systemInstruction: AGENT_1_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          topic: { type: Type.STRING },
          subtopic: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoning: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Agent 1 returned empty response");
  return JSON.parse(text) as ClassifierResponse;
};

// Agent 2: Difficulty Assessment
export const runAgent2_Assessor = async (question: string, classifierData: ClassifierResponse): Promise<AssessorResponse> => {
  const ai = getAIClient();
  const context = `Subject: ${classifierData.subject}, Topic: ${classifierData.topic}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Context: ${context}. Question: "${question}"`,
    config: {
      systemInstruction: AGENT_2_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intrinsicDifficulty: { type: Type.STRING },
          gradeLevel: { type: Type.STRING },
          adjustedDifficulty: { type: Type.STRING },
          complexityFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoning: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Agent 2 returned empty response");
  return JSON.parse(text) as AssessorResponse;
};

// Agent 3: Solution Generator (Streaming)
export const runAgent3_SolverStream = async (
  question: string, 
  classifierData: ClassifierResponse, 
  assessorData: AssessorResponse
) => {
  const ai = getAIClient();
  const context = `
    Subject: ${classifierData.subject}
    Topic: ${classifierData.topic}
    Difficulty: ${assessorData.adjustedDifficulty}
    Grade Level: ${assessorData.gradeLevel}
  `;

  return ai.models.generateContentStream({
    model: 'gemini-2.5-flash', // Using flash for speed, or pro for reasoning if needed
    contents: `Context: ${context}. \n\nSolve this Step-by-Step: "${question}"`,
    config: {
      systemInstruction: AGENT_3_SYSTEM_PROMPT,
    }
  });
};

// Agent 4: Practice Generator
export const runAgent4_Practice = async (
  question: string,
  solutionContext: string
) => {
  const ai = getAIClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Original Question: "${question}". \n\nSolution Context provided previously. Generate 3 practice problems now.`,
    config: {
      systemInstruction: AGENT_4_SYSTEM_PROMPT,
    }
  });
  
  return response.text || "Could not generate practice problems.";
};
