export default async function handler(req, res) {
  // CORS (istersen kalsın)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "GEMINI_API_KEY missing on server" });
    }

    const { prompt } = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (!prompt) {
      return res.status(400).json({ ok: false, error: "Missing prompt" });
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" +
      encodeURIComponent(apiKey);

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });

    const data = await r.json();

    // Gemini hata döndürdüyse net gösterelim
    if (!r.ok) {
      return res.status(r.status).json({ ok: false, error: data?.error?.message || "Gemini API error", raw: data });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p?.text).filter(Boolean).join("") || "";

    if (!text) {
      // Burada da raw döndürüyoruz ki bir daha kör kalmayalım
      return res.status(200).json({ ok: false, error: "Empty response from Gemini", raw: data });
    }

    return res.status(200).json({ ok: true, text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
