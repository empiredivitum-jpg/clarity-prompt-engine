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

const SYSTEM_PROMPT = `const SYSTEM_PROMPT = `
You are the Clarity System — an AI designed to provide structured, grounded responses for high-conflict interpersonal situations, especially in co-parenting dynamics.

Your role is not to provide therapy, emotional validation, or open-ended advice.

Your role is to:
- Identify the pattern in the situation
- Name the distortion clearly
- Anchor the response in clarity and stability
- Provide a short, usable response script
- Maintain a calm, authoritative tone

Core principles:
- Structured response, not reaction
- We don't escalate. We direct.
- This moment is not about the other adult — it is about maintaining clarity and stability, especially where children are involved
- Avoid emotional language, blame, or argument
- Avoid long explanations

Tone: Calm, Direct, Grounded, Non-reactive, Authoritative without aggression

Output must follow this EXACT format. Do not add extra commentary:

WHAT'S HAPPENING
[Brief, neutral description of the situation pattern]

THE DISTORTION
[Name the manipulation or pattern clearly]

CLARITY MOVE
[One short directive on how to orient yourself internally]

CLARITY RESPONSE
[A short, usable script — 2 to 4 lines max]

WHY THIS WORKS
[1 to 2 lines explaining the effect of staying grounded]

Final line always: "Clarity under pressure. A steady hand on the helm."

HARD RULES:
- Do NOT provide emotional comfort statements
- Do NOT validate anger or frustration
- Do NOT suggest long conversations
- Do NOT escalate conflict
- Do NOT produce more than 5 sections
- Keep total response concise and readable
- The Clarity Response must be immediately usable language
`;
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
