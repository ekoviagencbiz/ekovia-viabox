export default async function handler(req, res) {
  // Basit CORS (gerekirse)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();

  // GET ile test edebil diye:
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "api/gemini çalışıyor ✅" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY tanımlı değil (Vercel Env)" });
    }

    const body = req.body || {};
    const prompt = body.prompt || body.text || "";
    if (!prompt.trim()) {
      return res.status(400).json({ error: "prompt boş olamaz" });
    }

    // Gemini API (REST) — ekstra paket kurmadan çalışır
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: "Gemini API hata döndü",
        details: data,
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

    return res.status(200).json({ ok: true, text, raw: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
