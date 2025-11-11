import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🧠 Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Missing OPENAI_API_KEY");
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in environment" });
    }
    if (!process.env.OPENAI_PROJECT_ID) {
      console.error("❌ Missing OPENAI_PROJECT_ID");
      return res.status(500).json({ error: "Missing OPENAI_PROJECT_ID in environment" });
    }

    const inputs = req.body || {};

    const systemPrompt = `
You are Pool ChemGPT, a professional pool-water technician.
Analyse the pool readings below and generate a clear treatment report.

${JSON.stringify(inputs, null, 2)}

Respond in markdown with:
- Heading: "Pool Water Treatment Report"
- Sections: Analysis, Chemical Adjustments (dosages in g/mL based on pool_volume), Step-by-Step Actions, Maintenance Checklist.
`;

    const projectId = process.env.OPENAI_PROJECT_ID;
    const apiUrl = `https://api.openai.com/v1/projects/${projectId}/chat/completions`;

    console.log("🧩 Using Project ID:", projectId);
    console.log("📡 Requesting:", apiUrl);

    const openaiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a pool chemical treatment report." },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await openaiRes.json();
    console.log("🧾 OpenAI Response:", JSON.stringify(data, null, 2));

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
    console.error("💥 Server crashed:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
