// mcp.js  (CommonJS)
// Exposes tools the OpenAI builder can discover, and proxies to your backend.

const express = require("express");
const cors = require("cors");

// Built-in fetch (Node 18+) — no node-fetch needed
const BACKEND_BASE = process.env.BACKEND_BASE || "https://reclaimassist.onrender.com";
const PUBLIC_URL   = process.env.PUBLIC_URL   || "https://REPLACE_WITH_MCP_URL.onrender.com";

const app = express();
app.use(cors());
app.use(express.json());

// Manifest (optional)
app.get("/.well-known/ai-plugin.json", (_req, res) => {
  res.json({
    name_for_human: "ReClaim Backend",
    name_for_model: "reclaim_backend",
    description_for_model: "Tools for ReClaim Assist: fetch templates and save cases.",
    schema_version: "v1",
    api: { type: "openapi", url: `${PUBLIC_URL}/openapi.json` }
  });
});

// OpenAPI (REQUIRED for tool discovery)
app.get("/openapi.json", (_req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "ReClaim MCP Bridge",
      version: "1.0.0",
      description: "MCP tools that call the ReClaim backend."
    },
    servers: [{ url: PUBLIC_URL }],
    paths: {
      "/mcp/get_template": {
        post: {
          summary: "Fetch a template by ID",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["template_id"],
                  properties: { template_id: { type: "string" } }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Template payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      result: {
                        type: "object",
                        properties: {
                          template_body: { type: "string" },
                          citations: { type: "array", items: { type: "string" } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/mcp/save_case": {
        post: {
          summary: "Save case information",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", additionalProperties: true } } }
          },
          responses: {
            "200": {
              description: "Case saved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      result: {
                        type: "object",
                        properties: {
                          case_id: { type: "string" },
                          status_url: { type: "string", nullable: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});

// Tool implementations (proxy to backend)
app.post("/mcp/get_template", async (req, res) => {
  try {
    const { template_id } = req.body || {};
    if (!template_id) return res.status(400).json({ error: "template_id required" });

    const r = await fetch(`${BACKEND_BASE}/templates/${encodeURIComponent(template_id)}`);
    if (!r.ok) throw new Error(`Backend ${r.status} ${r.statusText}`);
    const data = await r.json();
    res.json({ result: data });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.post("/mcp/save_case", async (req, res) => {
  try {
    const r = await fetch(`${BACKEND_BASE}/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {})
    });
    if (!r.ok) throw new Error(`Backend ${r.status} ${r.statusText}`);
    const data = await r.json();
    res.json({ result: data });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

const PORT = process.env.PORT || 3000;
app.get('/', (_req, res) => res.send('ReClaim MCP bridge up'));
app.listen(PORT, () => console.log(`MCP bridge running on port ${PORT}`));
