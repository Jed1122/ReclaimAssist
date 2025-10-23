// mcp.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// --- Describe available tools to the builder ---
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.json({
    name_for_human: "ReClaim Backend",
    name_for_model: "reclaim_backend",
    description_for_model:
      "Fetches letter templates and saves appeal cases for ReClaim Assist.",
    schema_version: "v1",
    tools: [
      {
        name: "get_template",
        description: "Fetch a template by ID",
        input_schema: {
          type: "object",
          properties: { template_id: { type: "string" } },
          required: ["template_id"]
        }
      },
      {
        name: "save_case",
        description: "Save case information",
        input_schema: { type: "object", properties: {}, additionalProperties: true }
      }
    ]
  });
});

// --- tool implementations ---
app.post("/mcp/get_template", async (req, res) => {
  const { template_id } = req.body;
  try {
    const r = await fetch(`https://reclaimassist.onrender.com/templates/${template_id}`);
    const data = await r.json();
    res.json({ result: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/mcp/save_case", async (req, res) => {
  try {
    const r = await fetch(`https://reclaimassist.onrender.com/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json({ result: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MCP bridge running on port ${PORT}`));
