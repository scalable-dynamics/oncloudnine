export async function generateImage(req, KV: KVNamespace) {
  try {
    const apiKey = await KV.get('OPENAI_API_KEY');
    const orgId = await KV.get('OPENAI_ORG_ID');
    const { prompt, size = "1024x1024", count = 1 } = await req.json();
    let image = await generateDallEImage("https://api.openai.com/v1", {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${apiKey}`,
      ...(orgId ? { 'OpenAI-Organization': orgId } : {})
    }, prompt, size, count);
    console.log('image', image);
    return new Response(JSON.stringify(image), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error(e);
    return new Response("Error: " + e.toString(), { status: 500 });
  }
}

async function generateDallEImage(baseUrl, headers, prompt, size = "1024x1024", n = 1) {
  const response = await fetch(`${baseUrl}/images/generations`, {
    headers,
    method: 'POST',
    body: JSON.stringify({
      prompt,
      size,
      n,
      model: n > 1 ? "dall-e-2" : "dall-e-3",
    })
  })
  const image: any = await response.json()
  if (image && image.data && image.data[0] && image.data[0].url) {
    return {
      url: image.data[0].url,
      alt: image.data[0].revised_prompt
    }
  }
}


interface Env {
  CloudNineAI: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  return generateImage(context.request, context.env.CloudNineAI);
}