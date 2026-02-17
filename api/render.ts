import OpenAI from "openai";
import { toFile } from "openai/uploads";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).send("Use POST");
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { baseImageBase64, patternImageBase64, config } = body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel env vars" });
    }
    if (!baseImageBase64) {
      return res.status(400).json({ error: "Missing baseImageBase64" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const cleanBase64 = (b64: string) => (b64.includes(",") ? b64.split(",")[1] : b64);

    // Convert base64 -> File (lo que espera el endpoint de edits)
    const baseBuf = Buffer.from(cleanBase64(baseImageBase64), "base64");
    const baseFile = await toFile(baseBuf, "base.png");

    const files: any[] = [baseFile];

    // Si mandas patrón, lo pasamos como 2ª imagen de referencia
    if (patternImageBase64) {
      const patBuf = Buffer.from(cleanBase64(patternImageBase64), "base64");
      const patFile = await toFile(patBuf, "pattern.png");
      files.push(patFile);
    }

    const prompt = `
Senior industrial product photographer.

STRICT:
- Do NOT modify umbrella geometry.
- Preserve straps, screws, joints, ribbons exactly.
- Pure white background.
- Entire umbrella visible. No cropping.

Task:
- Use image[0] as the base umbrella.
- If image[1] exists, apply it as the canopy textile pattern realistically along panels & seams.
- Otherwise use solid color: ${config?.solidColor}.
- Respect any user instructions: ${config?.specialInstructions || ""}

Output: photorealistic product render.
`;

    // Image edits endpoint (para modificar una imagen existente)
    const result = await client.images.edits({
      model: "gpt-image-1",
      image: files, // array permitido
      prompt,
      size: "1024x1024",
    });

    const b64 = result.data?.[0]?.b64_json;
    return res.status(200).json({ image: b64 ? `data:image/png;base64,${b64}` : null });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
