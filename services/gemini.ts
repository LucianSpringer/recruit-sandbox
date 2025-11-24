import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, ExperienceLevel, CompanyContext } from "../types";

// Initialize Gemini Client
// IMPORTANT: API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GENERATION_MODEL = 'gemini-3-pro-preview';
const CHAT_MODEL = 'gemini-3-pro-preview';

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
    
    Company Context:
    ${companyContext.mission ? `- Mission: ${companyContext.mission}` : '- Mission: Not specified'}
    ${companyContext.values ? `- Core Values: ${companyContext.values}` : '- Values: Not specified'}
    ${companyContext.culture ? `- Culture: ${companyContext.culture}` : '- Culture: Not specified'}
    
    Raw Notes:
    "${rawNotes}"
    
    You must generate two things:
    1. A polished, professional LinkedIn-ready Job Description (Markdown formatted).
       - It MUST be tailored to the "${experienceLevel}" level in terms of language complexity, responsibility scope, and requirements.
       - If company context is provided, you MUST weave the mission, values, and culture into the description to attract culturally aligned candidates.
    
    2. An Interview Guide with 10 behavioral questions.
       - The complexity and depth of the questions MUST match the "${experienceLevel}" level.
       - Questions must target the specific hard and soft skills identified in the JD.
       - Include questions that assess fit with the provided Core Values and Culture.
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
            jobDescription: { type: Type.STRING, description: "The full job description in Markdown format." },
            interviewGuide: {
              type: Type.ARRAY,
              description: "List of 10 behavioral interview questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  focusArea: { type: Type.STRING, description: "The skill or trait being assessed (e.g., 'Conflict Resolution')." },
                  rationale: { type: Type.STRING, description: "Why this question is relevant to the JD and Level." }
                },
                required: ["question", "focusArea", "rationale"]
              }
            }
          },
          required: ["jobTitle", "jobDescription", "interviewGuide"]
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