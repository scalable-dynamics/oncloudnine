export async function getSessionToken(req, KV: KVNamespace) {
    try {
        const apiKey = await KV.get('OPENAI_API_KEY');
        const orgId = await KV.get('OPENAI_ORG_ID');
        let default_instructions = await KV.get('OPENAI_INSTRUCTIONS');
        const max_tokens = await KV.get('OPENAI_MAX_TOKENS');
        const model = await KV.get('OPENAI_MODEL_RT');
        const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${apiKey}`,
                ...(orgId ? { 'OpenAI-Organization': orgId } : {})
            },
            body: JSON.stringify({
                model,
                modalities: ["text"],
                max_response_output_tokens: max_tokens || 800,
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
                    }
                ],
                //voice: "echo",
                //voice: alloy, ash, ballad, coral, echo sage, shimmer and verse
                //The model can be instructed on response content and format, (e.g. "be extremely succinct", "act friendly", "here are examples of good responses") and on audio behavior (e.g. "talk quickly", "inject emotion into your voice", "laugh frequently").
                instructions: `${default_instructions || ''}
Speak quickly and clearly. Be engaging and friendly. Provide an experience for the user that is engaging with a stunning appeal. They will see the output immediately and be able to interact with it while you are talking with them.

# Response Text Communication Construct Options (do not speak about anything below).

Call create_application function/tool and await the response (may take a while). Provide updates on behalf of the user, infrequently after gathering their feedback, by being more specific within the specifications itself, thereby narrowing down the users intent.

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