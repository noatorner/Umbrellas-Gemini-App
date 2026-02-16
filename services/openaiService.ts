import { DesignConfig } from "../types";

export const generateProfessionalUmbrella = async (
  baseImageBase64: string,
  patternImageBase64: string | null,
  config: DesignConfig
): Promise<string | null> => {
  const r = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseImageBase64,
      patternImageBase64,
      config
    }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error en /api/render");
  return data.image;
};
