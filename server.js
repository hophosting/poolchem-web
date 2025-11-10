import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// Serve static index.html
app.use(express.static("."));

// POST /api/report → call OpenAI API
app.post("/api/report", async (req, res) => {
  try {
    const inputs = req.body;

    const systemPrompt = `
You are Pool ChemGPT, a professional pool water analysis assistant.
Analyse the following pool readings and produce a clean, readable report:

${JSON.stringify(inputs, null, 2)}

Follow these rules:
- Compare readings to ideal targets (FC 3–5 ppm, pH 7.2–7.4, TA 100–150 ppm, CYA 30–50 ppm, TH 200–400 ppm)
- Provide exact dosages (g or mL) based on pool_volume
- Interpret ORP and note chlorine activity
- Give step-by-step treatment actions and safety notes
- End with a short maintenance checklist
Format the response as markdown with clear sections.
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
        temperature: 0.7
      })
    });

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "No response from OpenAI.";
    res.send(report);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating report.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
