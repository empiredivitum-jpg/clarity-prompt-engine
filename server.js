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
- We don’t escalate. We direct.
- This moment is not about the other adult — it is about maintaining clarity and stability, especially where children are involved
- Avoid emotional language, blame, or argument
- Avoid long explanations

Tone:
- Calm
- Direct
- Grounded
- Non-reactive
- Authoritative without aggression

Output must follow this EXACT format. Do not add extra commentary:

Pattern Identified
[Brief, neutral description of the situation pattern]

Distortion Breakdown
[Name the observable pattern only]

Child Reality Anchor
[One sentence describing the child’s exposure or indirect impact]

Calm Authority Position
[Internal directive only]

Suggested Response (Script)
[2–4 lines max]

Forward Path
[One short sentence]

Final line always: "Clarity under pressure. A steady hand on the helm."
`;

function buildUserPrompt({ scenario, emotionalTone, childAge, urgencyLevel }) {
  return `
Situation: ${scenario}
Emotional State: ${emotionalTone || "Not provided"}
Children Involved: ${childAge || "Not provided"}
Is this recurring: ${urgencyLevel || "Not provided"}
`;
}

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Clarity Prompt Engine"
  });
});

app.post(
  "/clarity-response",
  (req, res, next) => {
    const apiKey = req.headers["authorization"];

    if (!process.env.API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Server missing API key configuration"
      });
    }

    if (!apiKey || apiKey !== `Bearer ${process.env.API_KEY}`) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized request"
      });
    }

    next();
  },
  async (req, res) => {
    try {
      const { scenario, childAge, emotionalTone, urgencyLevel } = req.body;

      if (!scenario || scenario.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: "Scenario input is required and must be at least 10 characters."
        });
      }

      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.45,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: buildUserPrompt({
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

      return res.json({
        success: true,
        clarity_response: raw,
        tags: ["ClarityPrompt_User", "Scenario_Submitted"]
      });

    } catch (error) {
      console.error("Clarity Engine Error:", error);

      return res.status(500).json({
        success: false,
        error: "The Clarity Prompt Engine could not generate a response. Please try again."
      });
    }
  }
);

const PORT = process.env.PORT || 3000;

console.log("Server starting...");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
