export async function getSessionToken(req, KV: KVNamespace) {
    try {
        const apiKey = await KV.get('OPENAI_API_KEY');
        const orgId = await KV.get('OPENAI_ORG_ID');
        let default_instructions = await KV.get('OPENAI_INSTRUCTIONS');
        const max_tokens = await KV.get('OPENAI_MAX_TOKENS');
        const model = await KV.get('OPENAI_MODEL_RT');
        const args = await req.json();
        const voice = args?.voice || "echo";
        const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${apiKey}`,
                ...(orgId ? { 'OpenAI-Organization': orgId } : {})
            },
            body: JSON.stringify({
                model,
                voice,
                modalities: ["text", "audio"],
                max_response_output_tokens: max_tokens || 4000,
                input_audio_transcription: {
                    model: "whisper-1",
                },
                tools: [
                    {
                        type: "function",
                        name: "create_application",
                        description: "Create an responsive, mobile-friendly application (HTML,JavaScript,CSS,WEBGL,SVG,etc.) with the given name and specifications.",
                        parameters: {
                            type: "object",
                            properties: {
                                "name": {
                                    description: "The name of the application.",
                                    type: "string",
                                },
                                "specs": {
                                    description: "The complete specifications for the application.",
                                    type: "string",
                                },
                            },
                            required: ["name", "specs"],
                            additionalProperties: false,
                        },
                    },
                    {
                        type: "function",
                        name: "generate_image",
                        description: "Generate an image with the given description and size.",
                        parameters: {
                            type: "object",
                            properties: {
                                "description": {
                                    description: "The description of the image to generate.",
                                    type: "string",
                                },
                                "size": {
                                    description: "The size of the image to generate.",
                                    type: "string",
                                    enum: ["1024x1024", "512x512", "256x256", "128x128", "64x64", "32x32", "16x16"],
                                },
                            },
                            required: ["description", "size"],
                            additionalProperties: false,
                        },
                    },
                    {
                        type: "function",
                        name: "create_document",
                        description: "Create a (markdown) document with the given title and content.",
                        parameters: {
                            type: "object",
                            properties: {
                                "title": {
                                    description: "The title of the document.",
                                    type: "string",
                                },
                                "markdown": {
                                    description: "The markdown content of the document.",
                                    type: "string",
                                },
                            },
                            required: ["title", "markdown"],
                            additionalProperties: false,
                        },
                    },
                    {
                        type: "function",
                        name: "add_memory",
                        description: "Adds a memory to the AI's memory bank for later recall.",
                        parameters: {
                            type: "object",
                            properties: {
                                "description": {
                                    description: "Memory description.",
                                    type: "string",
                                },
                            },
                            required: ["description"],
                            additionalProperties: false,
                        },
                    },
                    {
                        type: "function",
                        name: "update_persona",
                        description: "Update the appearance and personality of your avatar.",
                        parameters: {
                            type: "object",
                            properties: {
                                "name": {
                                    description: "Your name",
                                    type: "string",
                                },
                                "description": {
                                    description: "A description of your personality.",
                                    type: "string",
                                },
                                "message": {
                                    description: "A message to the user when they first interact with you.",
                                    type: "string",
                                },
                                "avatar": {
                                    description: "The shape of the avatar.",
                                    type: "string",
                                    enum: ["masculine", "feminine"],
                                },
                                "voice": {
                                    description: "The voice of the avatar.",
                                    type: "string",
                                    enum: ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"],
                                },
                                "appearance": {
                                    description: "The new appearance of the avatar (must be a JSON string describing the avatar's appearance - e.g. eyeColor, eyeSpacing, eyeWidth, eyeBrowColor, eyeBrowSize, eyeLidColor, eyeOutlineColor, mouthSize, mouthWidth, mouthHeight, noseSize, noseWidth, noseHeight, lipColor, lipSize, skinHue, skinBrightness, skinGrayScale).",
                                    type: "object",
                                    properties: {
                                        eyeColor: { type: "string" },
                                        eyeSpacing: { type: "number" },
                                        eyeWidth: { type: "number" },
                                        eyeBrowColor: { type: "string" },
                                        eyeBrowSize: { type: "number" },
                                        eyeLidColor: { type: "string" },
                                        eyeOutlineColor: { type: "string" },
                                        mouthSize: { type: "number" },
                                        mouthWidth: { type: "number" },
                                        mouthHeight: { type: "number" },
                                        noseSize: { type: "number" },
                                        noseWidth: { type: "number" },
                                        noseHeight: { type: "number" },
                                        lipColor: { type: "string" },
                                        lipSize: { type: "number" },
                                        skinHue: { type: "number" },
                                        skinBrightness: { type: "number" },
                                        skinGrayScale: { type: "number" },
                                    },
                                    additionalProperties: false,
                                    required: ["eyeColor", "eyeSpacing", "eyeWidth", "eyeBrowColor", "eyeBrowSize", "eyeLidColor", "eyeOutlineColor", "mouthSize", "mouthWidth", "mouthHeight", "noseSize", "noseWidth", "noseHeight", "lipColor", "lipSize", "skinHue", "skinBrightness", "skinGrayScale"],
                                },
                            },
                            required: ["name", "description", "message", "avatar", "voice", "appearance"],
                            additionalProperties: false,
                        },
                    }
                ],
                //The model can be instructed on response content and format, (e.g. "be extremely succinct", "act friendly", "here are examples of good responses") and on audio behavior (e.g. "talk quickly", "inject emotion into your voice", "laugh frequently").
                instructions: `${default_instructions || ''}
Speak quickly and clearly. Be engaging and friendly. Provide an experience for the user that is engaging with a stunning appeal. They will see the output immediately and be able to interact with it while you are talking with them.

# Tool Calling Options (do not speak about anything below).

Call the add_memory function for things such as the user's name and preferences, to add the memory the AI's memory bank for later recall. This will help the AI remember the user's preferences and provide a more personalized experience.

When calling the update_persona function, the values are relative to a CSS-controlled avatar which automatically places the facial elements and color filters.

Existing appearance for reference:
- name: ${args.name || ''}
- description: ${args.description || ''}
- message: ${args.message || ''}
- avatar: ${args.avatar === 2 ? 'feminine' : 'masculine'}
- voice: ${args.voice || 'echo'}
- appearance: ${JSON.stringify({
                    eyeColor: args.eyeColor,
                    eyeSpacing: args.eyeSpacing,
                    eyeWidth: args.eyeWidth,
                    eyeBrowColor: args.eyeBrowColor,
                    eyeBrowSize: args.eyeBrowSize,
                    eyeLidColor: args.eyeLidColor,
                    eyeOutlineColor: args.eyeOutlineColor,
                    mouthSize: args.mouthSize,
                    mouthWidth: args.mouthWidth,
                    mouthHeight: args.mouthHeight,
                    noseSize: args.noseSize,
                    noseWidth: args.noseWidth,
                    noseHeight: args.noseHeight,
                    lipColor: args.lipColor,
                    lipSize: args.lipSize,
                    skinHue: args.skinHue,
                    skinBrightness: args.skinBrightness,
                    skinGrayScale: args.skinGrayScale,
                })}
\`\`\`

When calling generate_image function/tool, await the response (may take a while) and inform the user about what is being created. Each image will be saved as a file.

When calling create_application function/tool, await the response (may take a while) and inform the user about what is being created. Provide updates on behalf of the user, infrequently after gathering their feedback, by being more specific within the specifications itself, thereby narrowing down the users intent.

Follow these guidelines when generating HTML:
1. Use expressive CSS+animations (or WebGL+Shaders) to draw and animate visual elements.
2. Don't include image tags or external resources.
3. Use local storage and other means of caching data for the user.
4. If including input fields, place them within a form element with method="dialog" and an appropriate action attribute or onsubmit event.
5. When using script tags, ensure that the JavaScript code is fully complete and uses functions to delineate the required functionality.
6. If an external API is required, provide a configuration pane for the user to save their preferred settings.
7. Use any of the following for the theme of all apps generated, adding the necessary enhancements with CSS. Choices: Spectre.css, MatchaCSS, 98.CSS, XP.css, PaperCSS, MetroCSS, Water.css, Mini.css, Miligram, Shoelace.css, Skeleton, Simple.css, MVP.css

When imagining the contents of each information space, consider:
- Unique technologies, design trends, or social dynamics that might enable this to exist
- Deeper themes, ideas, or meanings that could be subtly woven into the content and purpose
- How history might look different if this were to exist
- How this site might expand the possibilities of what the internet can be used for
- How the user might interact with the site, and what they might learn or experience
- How the site might be discovered by other users, and what they might think of it

**Provide an experience for the user that is engaging with a stunning appeal. They will see the output immediately and be able to interact with it while you are talking with them.**
`
            }),
        });
        const data: any = await r.json();
        console.log(data);
        if (!data || !data.client_secret || !data.client_secret.value) return new Response("Error", { status: 500 });
        return new Response(data.client_secret.value, { headers: { 'Content-Type': 'plain/text' } });
    } catch (e: any) {
        console.error(e);
        return new Response("Error: " + e.toString(), { status: 500 });
    }
}

interface Env {
    CloudNineAI: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    return getSessionToken(context.request, context.env.CloudNineAI);
}