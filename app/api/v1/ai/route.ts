import { NextResponse } from 'next/server';
import { generateAIChoice } from '@/lib/ai-client';
import { verifyAndIncrement } from '@/lib/rate-limit';
import { validateOrigin, getCookie } from '@/lib/security';
import { z } from 'zod';

const aiSchema = z.object({
  userProfile: z.object({
    persona: z.enum(['individual', 'family', 'farmer', 'traveller', 'senior']),
    locationName: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    householdSize: z.number().optional(),
    hasChildren: z.boolean().optional(),
    hasElderly: z.boolean().optional(),
    medicalDependencies: z.array(z.string()).optional(),
    commuteMode: z.enum(['bike', 'car', 'public', 'walk', 'none']).optional(),
    commuteStart: z.string().optional(),
    commuteEnd: z.string().optional(),
    farmCrop: z.string().optional(),
    farmLivestock: z.boolean().optional()
  }),
  weatherData: z.object({
    currentTemp: z.number(),
    currentPrecipitation: z.number(),
    currentWindSpeed: z.number(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    riskReason: z.string(),
    dailyForecast: z.array(z.any()),
    hourlyPrecipitation: z.array(z.number()),
    hourlyTime: z.array(z.string()),
    updatedAt: z.string()
  }),
  routeData: z.any().optional().nullable(),
  incidents: z.array(z.any()).optional().default([]),
  shelters: z.array(z.any()).optional().default([]),
  question: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden: Request origin is not allowed' }, { status: 403 });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const currentToken = getCookie(request, 'varsha-rl-ai');

    const { allowed, newToken } = verifyAndIncrement(ip, currentToken, 5, 60000);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before making another AI request.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = aiSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: `Invalid AI input parameters: ${errorMsg}` }, { status: 400 });
    }
    const { userProfile, weatherData, routeData, incidents, shelters, question } = parseResult.data;

    // Retrieve custom client-side API keys from request headers if present
    const clientProvider = request.headers.get('x-provider') || undefined;
    const clientApiKey = request.headers.get('x-api-key') || undefined;

    let systemPrompt = '';
    let userPrompt = '';

    if (question) {
      // Prompt for answering a specific conversational safety question
      systemPrompt = `You are VarshaAI, an expert Disaster Preparedness & AI Decision Intelligence Coordinator.
Your role is to answer the user's specific safety question, grounded strictly in their provided weather, commute routes, community incident alerts, and personal household context.

CRITICAL RULES:
1. You must respond ONLY with a valid JSON object matching this schema:
   {
     "answer": "Your detailed, direct, 2-4 sentence conversational response. Be empathetic, practical, and highly specific to their location and persona."
   }
2. Do not include any markdown styling like \`\`\`json or pre/post explanations. Return ONLY the raw JSON.
3. If the data required to answer the question is unavailable, state this clearly in the answer rather than guessing or fabricating details.`;

      userPrompt = `
User Question: "${question}"

User Profile Context:
${JSON.stringify(userProfile, null, 2)}

Live Weather Data:
${JSON.stringify(weatherData, null, 2)}

Commute Route Details (OSRM):
${routeData ? JSON.stringify(routeData, null, 2) : 'No commute route specified.'}

Active Community Incidents:
${JSON.stringify(incidents, null, 2)}

Nearest Shelters and Hospitals:
${JSON.stringify(shelters, null, 2)}
`;
    } else {
      // Prompt for generating the full structured Action Plan
      systemPrompt = `You are VarshaAI, an expert Disaster Preparedness & AI Decision Intelligence Coordinator.
Your role is to translate raw weather, commute routes, community incident alerts, and personal household context into a highly personalized, actionable, explainable, and time-prioritized monsoon safety plan.

CRITICAL RULES:
1. You must respond ONLY with a valid JSON object matching the schema below. Do not include any markdown styling like \`\`\`json or pre/post explanations. Just return raw JSON.
2. DO NOT fabricate recommendations. Ground every action card on the provided weather details, location, and user context.
3. Every action item must cite its direct data "evidence" (e.g. "80mm rainfall sum forecast"), its "source" (e.g. "Open-Meteo", "Community Reports"), and a "confidence" percentage between 1 and 100 representing how well the recommendation fits the data.
4. Recommendations must be tailored to the user's Persona:
   - 'family': prioritize elderly care, children safety, power backups, and medical supplies.
   - 'farmer': focus on crop harvesting timelines, livestock shelter, and pesticide schedules.
   - 'traveller': focus on OSRM commute details, road blocks, flooded roads, and travel windows.
   - 'senior': prioritize immediate offline contacts, power backups, and accessibility aids.
   - 'individual': focus on local alerts, general preparedness, and daily commute warnings.

JSON Response Schema:
{
  "summary": "A 1-2 sentence plain-language description of the current risk and what to expect.",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "actions": [
    {
      "id": "unique-string-id",
      "title": "Short title of action",
      "description": "Detailed explanation of what the user should do.",
      "urgency": "immediate" | "today" | "upcoming",
      "timeframe": "Specific time window, e.g. 'Within 30 minutes', 'Before 4 PM', 'Tonight'",
      "icon": "battery-charging" | "map" | "pill" | "umbrella" | "phone" | "shield-alert" (choose best fit),
      "why": "How this helps the specific persona context.",
      "evidence": "The specific data point justifying this action (e.g. '50mm rain', 'power cut nearby').",
      "source": "Where the data came from (e.g. 'Open-Meteo', 'Supabase Reports')",
      "confidence": 90
    }
  ],
  "avoidList": [
    "Specific items to avoid, e.g. Dadar Station Road (flooding reported)"
  ],
  "timeline": [
    {
      "timeframe": "Immediate / Next 30 Mins",
      "task": "Task description",
      "priority": "high" | "medium" | "low"
    }
  ],
  "confidenceScore": 85, // Overall confidence score based on data completeness
  "sourcesUsed": ["Open-Meteo", "Nominatim", "OSRM", "Community Reports"]
}`;

      userPrompt = `
User Profile:
${JSON.stringify(userProfile, null, 2)}

Live Weather Data:
${JSON.stringify(weatherData, null, 2)}

Commute Route Details (OSRM):
${routeData ? JSON.stringify(routeData, null, 2) : 'No commute route specified.'}

Active Community Incidents:
${JSON.stringify(incidents, null, 2)}

Nearest Shelters and Hospitals:
${JSON.stringify(shelters, null, 2)}
`;
    }

    const rawResponse = await generateAIChoice(systemPrompt, userPrompt, {
      provider: clientProvider as 'openrouter' | 'gemini',
      apiKey: clientApiKey
    });

    // Clean up response if the model accidentally wrapped it in code blocks
    let cleanedResponse = rawResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.substring(7);
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.substring(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
    }
    cleanedResponse = cleanedResponse.trim();

    // Verify it is valid JSON
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanedResponse);
    } catch {
      console.error('Failed to parse AI JSON response. Raw output was:', rawResponse);
      throw new Error('AI returned malformed JSON content.');
    }

    const response = NextResponse.json(parsedJson);
    response.headers.set(
      'Set-Cookie',
      `varsha-rl-ai=${newToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=60`
    );
    return response;
  } catch (error: unknown) {
    console.error('AI Action Plan generation failed:', error);
    return NextResponse.json({
      error: 'AI Engine failed',
      message: (error as Error).message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
