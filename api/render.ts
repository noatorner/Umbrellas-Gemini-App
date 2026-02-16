import OpenAI from "openai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Use POST");
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { baseImageBase64, config } = body || {};

    if (!process.env.OPENAI_API_KEY) {
      res.statusCode = 500;
      return res.json({ error: "Missing OPENAI_API_KEY in server env" });
    }

    if (!baseImageBase64) {
      res.statusCode = 400;
      return res.json({ error: "Missing baseImageBase64" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
Senior Industrial Product Photographer.

STRICT:
Do NOT modify umbrella geometry.
Preserve straps, screws, joints, ribbons exactly.
Pure white background.
Entire umbrella visible.
High precision product render.

Apply pattern / design according to config:
${JSON.stringify(config)}
`;

    const cleanBase64 = (b64: string) => (b64.includes(",") ? b64.split(",")[1] : b64);

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      image: `data:image/png;base64,${cleanBase64(baseImageBase64)}`,
      size: "1024x1024",
    });

    const b64 = result.data?.[0]?.b64_json;
    res.statusCode = 200;
    return res.json({ image: b64 ? `data:image/png;base64,${b64}` : null });
  } catch (e: any) {
    res.statusCode = 500;
    return res.json({ error: e?.message || "Server error" });
  }
}
