import { GoogleGenAI } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Translates text using Gemini 3 Flash Preview for speed and efficiency.
 */
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  try {
    const prompt = `You are a professional translator. Translate the following text strictly from ${sourceLang} to ${targetLang}. Do not add any explanations, just provide the translation.\n\nText:\n${text}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Không thể dịch nội dung này.";
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};

/**
 * Edits an image using Gemini 2.5 Flash Image (Nano Banana).
 * Uses the image + text prompt method.
 */
export const editImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano banana model
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Extract the image from the response parts
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("Không tìm thấy hình ảnh trong phản hồi của Gemini.");
  } catch (error) {
    console.error("Image edit error:", error);
    throw error;
  }
};

/**
 * Analyzes an image using Gemini 3 Pro Preview.
 */
export const analyzeImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Requested model for analysis
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: prompt || "Hãy mô tả chi tiết những gì bạn thấy trong hình ảnh này.",
          },
        ],
      },
    });

    return response.text || "Không thể phân tích hình ảnh này.";
  } catch (error) {
    console.error("Image analysis error:", error);
    throw error;
  }
};

/**
 * Translates text content visible in a screen capture frame.
 * Uses Gemini 3 Flash Preview for low latency multimodal processing.
 */
export const translateScreenFrame = async (
  base64Image: string,
  mimeType: string,
  targetLang: string
): Promise<string> => {
  try {
    const prompt = `Analyze this screen capture. Identify any text present in the image and translate it directly into ${targetLang}.
    
    Rules:
    1. If no text is found, reply exactly "Không tìm thấy văn bản".
    2. Format the output nicely using Markdown.
    3. Be concise and focus on the translation.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Screen translation error:", error);
    return "Lỗi khi dịch màn hình (Rate limit hoặc lỗi mạng).";
  }
};