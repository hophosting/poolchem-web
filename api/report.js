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
- Sections: Analysis, Chemical Adjustments (dosages in g / mL based on pool_volume), Step-by-Step Actions, Maintenance Checklist.
`;

    // ✅ This endpoint is REQUIRED for sk-proj keys
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
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
        }),
      }
    );

    const data = await openaiRes.json();

    if (openaiRes.status !== 200) {
      console.error("OpenAI Error:", data);
      return res.status(500).json({ error: data.error?.message || "API error" });
    }

    const report = data?.choices?.[0]?.message?.content?.trim() || "No report generated.";
    res.status(200).send(report);

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
