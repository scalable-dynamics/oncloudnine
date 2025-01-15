export async function describeImage(req, KV: KVNamespace) {
  try {
    const apiKey = await KV.get('OPENAI_API_KEY');
    const orgId = await KV.get('OPENAI_ORG_ID');
    const model = "gpt-4o";
    const { text, image_url } = await req.json();
    let description = await executeOpenAIImagePrompt("https://api.openai.com/v1", {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${apiKey}`,
      ...(orgId ? { 'OpenAI-Organization': orgId } : {})
    }, model, [
      {
        role: 'user', content: [
          { type: 'text', text },
          { type: 'image_url', image_url: { url: image_url } },
        ]
      },
    ]);
    console.log('image description: ', description);
    return new Response(description, { headers: { 'Content-Type': 'text/plain' } });
  } catch (e: any) {
    console.error(e);
    return new Response("Error: " + e.toString(), { status: 500 });
  }
}

async function executeOpenAIImagePrompt(url, headers, model, messages, max_tokens = 1000, shouldContinue = true) {
  try {
    const response = await fetch(`${url}/chat/completions`, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        model,
        max_tokens,
        temperature: 0,
        messages: [
          { role: 'system', content: image_prompt },
          ...messages,
        ]
      })
    });
    const data: any = await response.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      const content = data.choices[0].message.content.trim();
      if (data.choices[0].finish_reason === "length" && shouldContinue) {
        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: 'Continue exactly where you left off' });
        max_tokens = Math.min(4095, max_tokens * 2);
        shouldContinue = max_tokens < 4095;
        const newContent = await executeOpenAIImagePrompt(url, headers, model, messages, max_tokens, shouldContinue);
        if (newContent.indexOf(content) === 0) {
          return newContent;
        } else {
          return content + newContent;
        }
      }
      else {
        return content;
      }
    } else {
      console.log(data);
      return "";
    }
  } catch (e) {
    console.log(e);
    return '🚨 An error occurred while generating content. Please try again.';
  }
}

const image_prompt = `Describe the image in detail, including the objects, people, animals, and activities. Include the colors, shapes, sizes, and positions of the objects. Describe the scene, setting, and background. Mention any text, logos, or symbols in the image. Provide any additional context or details that are relevant.`;

interface Env {
  CloudNineAI: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  return describeImage(context.request, context.env.CloudNineAI);
}