// /api/report.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ Check environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    const projectId = process.env.OPENAI_PROJECT_ID;

    if (!apiKey) {
      console.error("❌ Missing OPENAI_API_KEY");
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in environment" });
    }

    if (!projectId) {
      console.error("❌ Missing OPENAI_PROJECT_ID");
      return res.status(500).json({ error: "Missing OPENAI_PROJECT_ID in environment" });
    }

    const inputs = req.body || {};

    // 🧠 Build a professional system prompt
    const systemPrompt = `
You are Pool ChemGPT, a professional pool-water technician.
Analyse the readings below and generate a complete treatment report.

${JSON.stringify(inputs, null, 2)}

Respond in markdown with:
1. **Analysis**
2. **Chemical Adjustments** (include dosages in g/mL for ${inputs.pool_volume} L)
3. **Step-by-Step Treatment**
4. **Maintenance Recommendations**
`;

    // ✅ Correct endpoint for project-scoped keys
    const apiUrl = `https://api.openai.com/v1/projects/${projectId}/chat/completions`;

    console.log("📡 Sending request to:", apiUrl);

    // 🧩 Send request to OpenAI
    const openaiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a pool water treatment report." }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await openaiRes.json();

    // 🧾 Handle errors clearly
    if (!openaiRes.ok) {
      console.error("🚨 OpenAI API Error:", data);
      return res.status(openaiRes.status).json({
        error: data?.error?.message || "OpenAI API returned an error",
        status: openaiRes.status
      });
    }

    // ✅ Success
    const report = data?.choices?.[0]?.message?.content?.trim() || "No response generated.";
    return res.status(200).json({ report });

  } catch (err) {
    console.error("💥 Server error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
