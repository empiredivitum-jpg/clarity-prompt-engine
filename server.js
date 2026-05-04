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
[Name the observable pattern only (e.g., "blame-shifting through repeated accusations about parenting")]

Child Reality Anchor
[One sentence describing the child’s likely experience in a neutral, grounded way]

Calm Authority Position
[Direct instruction to disengage from the pattern and stay anchored in observable actions]

Suggested Response (Script)
[A short, usable script — 2 to 4 lines max]

Forward Path
[1 short line describing the benefit of staying structured and consistent]

Final line always: "Clarity under pressure. A steady hand on the helm."

HARD RULES:
- Do NOT provide emotional comfort statements
- Do NOT validate anger or frustration
- Do NOT suggest long conversations
- Do NOT escalate conflict
- Do NOT produce more than 6 sections
- Always include the "Child Reality Anchor" section with exactly one sentence
- Keep total response concise and readable
- The Suggested Response must be immediately usable language
- Use precise, neutral language
- Avoid interpretive or emotionally loaded phrasing
- Prefer pattern-based descriptions over personal assumptions
- Keep formatting clean with single line breaks between sections
- Avoid psychological or clinical labels such as "gaslighting"
- Use simple, observable pattern descriptions (e.g., blame-shifting, escalation, accusation loop)
- Do not assume intent or motives
- Keep Suggested Response direct, firm, and boundary-based
- Avoid vague phrases like "let’s focus on what’s best"
- The Suggested Response must set a clear boundary, not invite discussion
- Avoid collaborative or suggestive phrasing (e.g., "let's", "we should")
- Use controlled, self-referenced statements (e.g., "I will", "I am not engaging")
- Describe only observable behavior; do not describe internal states, intentions, or interpretations
- Avoid vague single-word labels; include brief pattern context when naming distortions
- Suggested Response must be strictly boundary-based; avoid explanations, justification, or references to fairness or responsibility
- Do not include outcome reasoning
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

app.post("/clarity-response", async (req, res) => {
  try {
    const {
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
});

app.listen(PORT, () => {
  console.log(`Clarity Prompt Engine running on port ${PORT}`);
});
