
import { GoogleGenAI } from "@google/genai";
import { DesignConfig } from "../types";

export const generateProfessionalUmbrella = async (
  baseImageBase64: string,
  patternImageBase64: string | null,
  config: DesignConfig
): Promise<string | null> => {
  // Create a new instance right before the call to ensure it uses the most up-to-date API key.
  // Using process.env.API_KEY directly as per guidelines.
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  const cleanBase64 = (b64: string) => b64.split(',')[1];

  const parts: any[] = [
    { text: "ROLE: Senior Industrial Product Photographer and CGI Artist." },
    { text: "STRICT GEOMETRY PROTECTION: You are forbidden from altering the physical structure of the umbrella. This includes ribbons, straps, fasteners, screws, rings, and any small hardware detail." }
  ];

  // 1. ESTRUCTURA (PROTECCIÓN TOTAL)
  parts.push({ text: "SOURCE STRUCTURE: Use this image as an absolute geometric template. Every detail, including handle straps, fabric labels, and metal joints, must be preserved exactly as they appear." });
  parts.push({ inlineData: { data: cleanBase64(baseImageBase64), mimeType: 'image/png' } });

  // 2. TEXTIL
  if (config.canopyMode === 'PATTERN' && patternImageBase64) {
    parts.push({ text: `TEXTILE APPLICATION: Apply the following pattern. Scale: ${config.patternScale}x. Alignment: X:${config.offsetX}%, Y:${config.offsetY}%. Wrap it realistically around each panel following the seams.` });
    parts.push({ inlineData: { data: cleanBase64(patternImageBase64), mimeType: 'image/png' } });
  } else {
    parts.push({ text: `TEXTILE COLOR: Solid color ${config.solidColor} with realistic fabric grain.` });
  }

  // 3. PUÑO Y MATERIALES
  let handleContext = `MATERIAL SPECIFICATIONS:
    - Material: ${config.handleMaterial === 'WOOD' ? `${config.handleWoodType} wood` : config.handleMaterial}.
    - Finish: ${config.handleFinish}.
    - Primary Color: ${config.handleColor}.
    - NOTE: Only change the color and material texture of the handle. Do NOT change its shape or any ribbons/straps attached to it.`;
  
  if (config.handleImageBase64) {
    handleContext = `HANDLE REPLACEMENT: Swap the original handle with this one. Apply color ${config.handleColor} and ${config.handleFinish} finish. Preserve any straps if visible in this new handle.`;
    parts.push({ text: handleContext });
    parts.push({ inlineData: { data: cleanBase64(config.handleImageBase64), mimeType: 'image/png' } });
  } else {
    parts.push({ text: handleContext });
  }

  // 4. INSTRUCCIONES ESPECIALES (FEEDBACK DEL USUARIO)
  if (config.specialInstructions.trim()) {
    parts.push({ text: `CRITICAL USER INSTRUCTIONS (PRIORITY 1): ${config.specialInstructions}` });
  }

  // 5. REGATÓN Y RENDER
  parts.push({ text: `TIP SPEC: Color ${config.tipColor}, ${config.tipMaterial} material, ${config.tipFinish} finish.` });

  parts.push({ text: `FINAL OUTPUT REQUIREMENTS:
    - Background: PURE WHITE (#FFFFFF).
    - Entire object must be visible from tip to handle.
    - No cropping. No artistic distortions. High precision industrial photography style.` });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts }
    });

    // Iterate through all parts to find the image part as per guidelines.
    const resultPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return resultPart ? `data:image/png;base64,${resultPart.inlineData.data}` : null;
  } catch (error: any) {
    console.error("Industrial Engine Error:", error);
    // Propagate the error for handling in the UI
    throw error;
  }
};
