import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the model with error handling
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function getTaskBreakdown(taskDescription: string) {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return "AI suggestions are not available. Please configure your Gemini API key.";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `Given this task: "${taskDescription}", provide a detailed breakdown of:
  1. Steps to complete the task
  2. Estimated time for each step
  3. Key considerations and potential challenges
  4. Resources needed
  Please format the response in a clear, structured way.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    return 'Unable to generate AI suggestions at this time. Please try again later.';
  }
}