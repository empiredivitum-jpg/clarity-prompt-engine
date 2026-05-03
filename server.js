import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const PORT = process.env.PORT || 3000;
const MODEL = process.env.CLARITY_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `
You are the Clarity Prompt Engine.

Your role is to transform emotionally charged interpersonal conflict into calm, structured, child-centered clarity.

You follow this exact framework:

1. Name the Pattern
2. Decode the Distortion
3. Anchor to the Child's Reality
4. Establish Calm Authority
5. Provide Exact Language Response
6. Define Forward Path

Constraints:
- Do not diagnose.
- Do not provide therapy.
- Do not use inflammatory labels.
- Do not escalate conflict.
- Do not encourage retaliation.
- Do not create legal, medical, or psychological advice.
- Always prioritize the child's emotional safety, stability, and nervous system.
- Tone must be calm, grounded, protective, and authoritative.
- Use plain language a parent can immediately understand.
- Provide a usable script the parent can say or send.
`;

function buildUserPrompt({ name, email, scenario, childAge, emotionalTone, urgencyLevel }) {
  return `
User Name: ${name || "Not provided"}
User Email: ${email || "Not provided"}
Child Age: ${childAge || "Not provided"}
Emotional Tone: ${emotionalTone || "Not provided"}
Urgency Level: ${urgencyLevel || "Not provided"}

Scenario:
${scenario}

Generate a Clarity Response using the full framework.

Return the response as JSON with these exact keys:

{
  "pattern_identified": "",
  "distortion_breakdown": "",
  "child_reality_anchor": "",
  "calm_authority_position": "",
  "suggested_response_script": "",
  "forward_path": "",
  "disclaimer": ""
}
`;
}

function toHtml(data) {
  return `
    <h2>1. Pattern Identified</h2>
    <p>${data.pattern_identified || ""}</p>

    <h2>2. Distortion Breakdown</h2>
    <p>${data.distortion_breakdown || ""}</p>

    <h2>3. Child Reality Anchor</h2>
    <p>${data.child_reality_anchor || ""}</p>

    <h2>4. Calm Authority Position</h2>
    <p>${data.calm_authority_position || ""}</p>

    <h2>5. Suggested Response Script</h2>
    <blockquote>${data.suggested_response_script || ""}</blockquote>

    <h2>6. Forward Path</h2>
    <p>${data.forward_path || ""}</p>

    <hr />

    <p><em>${data.disclaimer || "This is educational support, not therapy, legal advice, or medical advice."}</em></p>
  `;
}

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Clarity Prompt Engine"
  });
});

app.post("/clarity-response", async (req, res) => {
  try {
    const {
      name,
      email,
      scenario,
      childAge,
      emotionalTone,
      urgencyLevel
    } = req.body;

    if (!scenario || scenario.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Scenario input is required and must be at least 10 characters."
      });
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: buildUserPrompt({
            name,
            email,
            scenario,
            childAge,
            emotionalTone,
            urgencyLevel
          })
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      throw new Error("No response returned from OpenAI.");
    }

    const parsed = JSON.parse(raw);
    const html = toHtml(parsed);

    return res.json({
      success: true,
      clarity_response: parsed,
      clarity_response_html: html,
      tags: [
        "ClarityPrompt_User",
        "Scenario_Submitted"
      ]
    });

  } catch (error) {
    console.error("Clarity Engine Error:", error);

    return res.status(500).json({
      success: false,
      error: "The Clarity Prompt Engine could not generate a response. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Clarity Prompt Engine running on port ${PORT}`);
});
