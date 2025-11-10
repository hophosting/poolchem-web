import fetch from "node-fetch";

export default async function handler(req, res) {
  // ✅ Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ Read inputs from the request body
    const inputs = req.body || {};

    // ✅ Build a professional system prompt for GPT
    const systemPrompt = `
You are **Pool ChemGPT**, a professional swimming pool water analysis and maintenance assistant.

Your task:
- Analyse user-provided pool test results.
- Identify which chemical levels are outside the recommended ranges.
- Recommend exact chemical treatments (grams or mL) based on pool volume.
- Explain why each treatment is needed and provide safety instructions.
- End with a maintenance checklist.

User-supplied data:
${JSON.stringify(inputs, null, 2)}

Target Ranges:
- Free Chlorine (FC): 3–5 ppm
- pH: 7.2–7.4
- Total Alkalinity (TA): 100–150 ppm
- Cyanuric Acid (CYA): 30–50 ppm
- Total Hardness (TH): 200–400 ppm
- ORP: 650–750 mV (if available)
- Phosphates: ideally <100 ppb

Output:
- Present the report in **markdown** with clear headings and bullet points.
- Include exact product dosage recommendations using pool_volume.
- Keep the tone professional but friendly.
`;

    // ✅ Call OpenAI API
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
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    // ✅ Parse the API response safely
    const data = await response.json();

    // Log API output for debugging (visible in Vercel logs)
    console.log("OpenAI response:", data);

    // ✅ Handle missing or malformed responses
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(200).send("No response generated.");
    }

    // ✅ Return GPT's report content
    const report = data.choices[0].message.content.trim();
    res.status(200).send(report);

  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("Error generating report.");
  }
}
