import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, ExperienceLevel, CompanyContext } from "../types";

// Initialize Gemini Client
// IMPORTANT: API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GENERATION_MODEL = 'gemini-3-pro-preview';
const CHAT_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

/**
 * Generates the Job Description and Interview Guide based on raw notes.
 * Uses thinkingConfig for deep reasoning.
 */
export const generateRecruitmentPackage = async (
  rawNotes: string,
  experienceLevel: ExperienceLevel,
  companyContext: CompanyContext
): Promise<GeneratedContent> => {
  const prompt = `
    You are an expert HR Strategist. 
    Analyze the following raw notes for a job role and create a comprehensive recruitment package.
    
    Target Experience Level: ${experienceLevel}
    ${companyContext.jobTitle ? `Target Job Title: ${companyContext.jobTitle}` : ''}
    ${companyContext.jobFamily ? `Job Family: ${companyContext.jobFamily}` : ''}
    
    Company Context:
    ${companyContext.mission ? `- Mission: ${companyContext.mission}` : '- Mission: Not specified'}
    ${companyContext.values ? `- Core Values: ${companyContext.values}` : '- Values: Not specified'}
    ${companyContext.culture ? `- Culture: ${companyContext.culture}` : '- Culture: Not specified'}
    
    Raw Notes:
    "${rawNotes}"
    
    You must generate a structured JSON object containing:
    1. jobTitle: A polished, professional job title.
    2. keyResponsibilities: A list of 5-7 distinct, actionable key responsibilities or core duties.
    3. jobDescription: A polished, professional LinkedIn-ready Job Description in Markdown format.
       - IMPORTANT: Do NOT include the "Key Responsibilities" list in this markdown field, as it will be displayed separately.
       - Include sections for: Role Summary, Qualifications/Requirements, Benefits/Perks, and Company Culture (weaving in the mission/values).
       - Tailor language complexity to the "${experienceLevel}" level.
       - Use standard markdown (headings, bullet points, bold text) for formatting.
    
    4. interviewGuide: An Interview Guide with 10 behavioral questions.
       - The complexity must match the "${experienceLevel}" level.
       - Rationale: You MUST explicitly link the rationale to a specific skill, qualification, or company value mentioned in the Job Description. Explain exactly WHY this question is critical for this specific role.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking for complex synthesis
        // We do NOT set maxOutputTokens to avoid cutting off long responses after thinking
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            jobTitle: { type: Type.STRING, description: "A catchy, professional job title." },
            keyResponsibilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 5-7 distinct key responsibilities."
            },
            jobDescription: { type: Type.STRING, description: "The Job Description narrative (Role Summary, Qualifications, Benefits, Culture) in Markdown. Exclude the Key Responsibilities list." },
            interviewGuide: {
              type: Type.ARRAY,
              description: "List of 10 behavioral interview questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  focusArea: { type: Type.STRING, description: "The skill or trait being assessed." },
                  rationale: { type: Type.STRING, description: "Explain WHY this question is asked, explicitly citing a specific skill or value from the JD." }
                },
                required: ["question", "focusArea", "rationale"]
              }
            }
          },
          required: ["jobTitle", "keyResponsibilities", "jobDescription", "interviewGuide"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedContent;
    }
    throw new Error("No content generated");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

/**
 * Generates a header image for the job description.
 */
export const generateJobHeaderImage = async (jobTitle: string): Promise<string | null> => {
  try {
    // Using gemini-2.5-flash-image as per guidelines for general image generation
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ 
          text: `A professional, modern, abstract digital art background image suitable for a job posting header for the role of "${jobTitle}". 
                 Use corporate but creative color tones (blues, purples, clean white). 
                 Minimalist, high quality, 4k resolution, wide aspect ratio.` 
        }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null; 
  }
};

/**
 * Simple chat helper for the sidebar assistant.
 * Also uses the advanced model for high quality answers.
 */
export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[], 
  newMessage: string,
  context?: string
) => {
  try {
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      history: history,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Lower budget for chat to keep it snappy but smart
        systemInstruction: context 
          ? `You are an expert recruitment assistant. \n\nCONTEXT FROM GENERATED JOB DESCRIPTION:\n${context}\n\nUse the above context to answer the user's questions about the role.` 
          : 'You are an expert recruitment assistant.'
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};