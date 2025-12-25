
import { GoogleGenAI, Type } from "@google/genai";
import { TutorialNote } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getTutorialNotes = async (videoUrl: string): Promise<TutorialNote[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this YouTube video music and provide a simple melody sequence of piano keys (C4 to B5) to play it. 
    Format as JSON list of objects: { "key": "C4", "time": 0.5, "duration": 0.3 }. 
    Video URL: ${videoUrl}. 
    Provide roughly 20-30 notes for the main theme.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            key: { type: Type.STRING, description: "The music note like C4, D#4, etc." },
            time: { type: Type.NUMBER, description: "Start time in seconds relative to sequence start" },
            duration: { type: Type.NUMBER, description: "Duration in seconds" },
          },
          required: ["key", "time", "duration"],
        },
      },
    },
  });

  try {
    const data = JSON.parse(response.text);
    return data;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};
