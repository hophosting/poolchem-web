// /api/report.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Missing OPENAI_API_KEY");
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in environment" });
    }
    if (!process.env.OPENAI_PROJECT_ID) {
      console.error("⚠️ Missing OPENAI_PROJECT_ID (optional but recommended)");
    }

    // 🧾 Extract user input
    const inputs = req.body || {};

    // 🧠 Build system prompt for Pool ChemGPT
    const systemPrompt = `
You are **Pool ChemGPT**, a professional pool water technician.
Analyse the following pool test results and create a detailed report.

${JSON.stringify(inputs, null, 2)}

Respond in markdown format with the following sections:
1. **Analysis** — interpret the readings and identify issues.
2. **Chemical Adjustments** — give exact dosages (grams or mL) based on pool volume.
3. **Step-by-Step Treatment Plan** — what to do and in what order.
4. **Maintenance Recommendations** — ongoing care tips.
`;

    // 🌐 API endpoint (do NOT include /projects/${projectId})
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    console.log("📡 Sending request to:", apiUrl);

    // 🧩 Build API request
    const openaiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        // Optional header for organization/project
        "OpenAI-Project": process.env.OPENAI_PROJECT_ID || ""
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a pool water treatment report." }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    // 🧾 Parse response
    const data = await openaiRes.json();

    // 🧠 Handle API errors cleanly
    if (!openaiRes.ok) {
      console.error("🚨 OpenAI API Error:", data);
      return res.status(openaiRes.status).json({
        error: data?.error?.message || "OpenAI API returned an error",
        status: openaiRes.status
      });
    }

    // ✅ Extract the generated report
    const report = data?.choices?.[0]?.message?.content?.trim() || "No response generated.";
    return res.status(200).json({ report });

  } catch (err) {
    console.error("💥 Server error:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
