import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const inputs = req.body || {};
    const systemPrompt = `
You are Pool ChemGPT, a professional pool water analysis assistant.
Analyse the following pool readings and produce a clear treatment report:

${JSON.stringify(inputs, null, 2)}

Rules:
- Compare readings to ideal targets (FC 3–5 ppm, pH 7.2–7.4, TA 100–150 ppm, CYA 30–50 ppm, TH 200–400 ppm)
- Provide exact dosages (grams or mL) based on pool_volume
- Interpret ORP and note chlorine activity
- Give step-by-step treatment actions and safety notes
- End with a maintenance checklist
Format as markdown with headings and bullet points.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate my pool treatment report." }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("OpenAI response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(200).send("No response generated.");
    }

    res.status(200).send(data.choices[0].message.content);

  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("Error generating report.");
  }
}
