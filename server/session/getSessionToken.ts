export async function getSessionToken(req, KV: KVNamespace) {
    const apiKey = await KV.get('OPENAI_API_KEY');
    const orgId = await KV.get('OPENAI_ORG_ID');
    const instructions = await KV.get('OPENAI_INSTRUCTIONS');
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
            max_response_output_tokens: max_tokens || 200,
            instructions
        }),
    });
    const data: any = await r.json();
    if (!data || !data.client_secret || !data.client_secret.value) return new Response("Error", { status: 500 });
    return new Response(data.client_secret.value, { headers: { 'Content-Type': 'plain/text' } });
}

interface Env {
    CloudNineAI: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    return getSessionToken(context.request, context.env.CloudNineAI);
}