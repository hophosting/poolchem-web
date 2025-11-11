import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const inputs = req.body || {};

    const systemPrompt = `
You are Pool ChemGPT, a professional pool-water technician.
Analyse the pool readings below and generate a clear treatment report.

${JSON.stringify(inputs, null, 2)}

Respond in markdown with:
- Heading: "Pool Water Treatment Report"
- Sections: Analysis, Chemical Adjustments (dosages in g/mL based on pool_volume), Step-by-Step Actions, Maintenance Checklist.
`;

    // ✅ Correct endpoint for project-based keys
    const url = `https://api.openai.com/v1/projects/${process.env.proj_64u39ono87YjrHAQVTAoCIQn}/chat/completions`;

    console.log("🔑 Using project:", process.env.proj_64u39ono87YjrHAQVTAoCIQn);
    console.log("📦 Sending request to:", url);

    const openaiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.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}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a pool chemical treatment report." },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await openaiRes.json();
    console.log("🧾 OpenAI response:", JSON.stringify(data, null, 2));

    if (!openaiRes.ok) {
      console.error("🚨 OpenAI API Error:", data);
      return res.status(openaiRes.status).json({
        error: data?.error?.message || "OpenAI API error",
        status: openaiRes.status,
      });
    }

    const report = data?.choices?.[0]?.message?.content?.trim() || "No response generated.";
    return res.status(200).send(report);
  } catch (err) {
    console.error("💥 Server crashed with:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
