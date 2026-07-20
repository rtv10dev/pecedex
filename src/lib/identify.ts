export type SpeciesSuggestion = {
  commonName: string;
  scientificName: string;
  description: string;
  family: string;
  habitat: string;
  confidence: number;
  notes: string;
};

const PROMPT = `Eres un experto en peces marinos y de agua dulce.
Identifica la especie más probable en la foto.
Responde SOLO con JSON válido (sin markdown) con esta forma exacta:
{
  "commonName": "nombre común en español",
  "scientificName": "Nombre científico",
  "description": "2-3 frases en español sobre la especie",
  "family": "familia taxonómica",
  "habitat": "hábitat típico en español",
  "confidence": 0.0,
  "notes": "breve duda o rasgo clave si aplica"
}
Si no estás seguro, elige la mejor hipótesis y baja confidence.
Si no parece un pez, pon commonName vacío y notes explicando.`;

const DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
] as const;

function parseSuggestion(text: string): SpeciesSuggestion {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const data = JSON.parse(cleaned) as Partial<SpeciesSuggestion>;

  return {
    commonName: String(data.commonName ?? "").trim(),
    scientificName: String(data.scientificName ?? "").trim(),
    description: String(data.description ?? "").trim(),
    family: String(data.family ?? "").trim(),
    habitat: String(data.habitat ?? "").trim(),
    confidence: Math.max(0, Math.min(1, Number(data.confidence) || 0)),
    notes: String(data.notes ?? "").trim(),
  };
}

function modelsToTry(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  if (preferred) {
    return [preferred, ...DEFAULT_MODELS.filter((model) => model !== preferred)];
  }
  return [...DEFAULT_MODELS];
}

const HUMAN_IDENTIFY_ERROR =
  "Ha ocurrido un error. Vuelve a intentarlo de nuevo.";

async function callGemini(
  apiKey: string,
  model: string,
  imageBytes: Buffer,
  mimeType: string,
): Promise<{ ok: true; text: string } | { ok: false; status: number; detail: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBytes.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false, status: response.status, detail };
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    return {
      ok: false,
      status: 502,
      detail: "empty",
    };
  }

  return { ok: true, text };
}

export async function identifySpeciesFromImage(
  imageBytes: Buffer,
  mimeType: string,
): Promise<SpeciesSuggestion> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(HUMAN_IDENTIFY_ERROR);
  }

  let lastError = HUMAN_IDENTIFY_ERROR;

  for (const model of modelsToTry()) {
    const result = await callGemini(apiKey, model, imageBytes, mimeType);
    if (result.ok) {
      try {
        return parseSuggestion(result.text);
      } catch {
        lastError = HUMAN_IDENTIFY_ERROR;
        continue;
      }
    }

    lastError = HUMAN_IDENTIFY_ERROR;

    // 404/400 de modelo inexistente → probar siguiente
    if (result.status === 404 || result.status === 400) {
      continue;
    }
    // 429 en un modelo → probar alternativa (p. ej. flash-lite)
    if (result.status === 429) {
      continue;
    }
    // Otros errores (auth, etc.) no se recuperan cambiando de modelo
    if (result.status === 401 || result.status === 403) {
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}
