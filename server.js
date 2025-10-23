import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const TEMPLATES = {
  GENERIC_APPEAL: {
    template_body: `## Appeal of Out-of-Network Claim Denial

Payer: {{PAYER}}
Service date: {{SERVICE_DATE}}
Codes: CPT {{CPT_LIST}} | ICD-10 {{ICD_LIST}}

Denial reason: {{DENIAL_REASON}}

Sincerely,
[Patient Initials]
[Member ID last 4]`,
    citations: ["Plan OON benefits language", "Standard reimbursement guidance"],
  },
  TIMELY_FILING: {
    template_body: `## Appeal: Timely Filing

Payer: {{PAYER}}
Service date: {{SERVICE_DATE}}
Denial reason: {{DENIAL_REASON}}

Sincerely,
[Patient Initials]
[Member ID last 4]`,
    citations: ["Plan timely filing policy"],
  },
};

app.get("/templates/:template_id", (req, res) => {
  const t = TEMPLATES[req.params.template_id] || TEMPLATES.GENERIC_APPEAL;
  res.json(t);
});

app.post("/cases", (req, res) => {
  const id = nanoid(10);
  res.json({ case_id: id, status_url: `https://example.com/cases/${id}` });
});

app.get("/openapi.json", (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "ReClaim Backend API",
      version: "1.0.0",
      description:
        "Provides template retrieval and related backend services for ReClaim Assist",
    },
    paths: {
      "/templates/{template_id}": {
        get: {
          summary: "Get a letter template by ID",
          parameters: [
            {
              name: "template_id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Template details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      template_body: { type: "string" },
                      citations: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
});

app.listen(port, () => {
  console.log(`✅ ReClaim backend running on port ${port}`);
});
