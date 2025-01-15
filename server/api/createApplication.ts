export async function createApplication(req, KV: KVNamespace) {
    if (req.method !== 'POST') {
        return new Response("Bad Request", { status: 400 });
    }
    try {
        const apiKey = await KV.get('OPENAI_API_KEY');
        const orgId = await KV.get('OPENAI_ORG_ID');
        const model = await KV.get('OPENAI_MODEL');
        let { name, specs, html = '' } = await req.json();
        if (!name || !specs) {
            return new Response("Error", { status: 400 });
        }
        const intent = `Create an responsive, mobile-friendly application (HTML,JavaScript,CSS,WEBGL,SVG,etc.) with the name "${name}" and specifications: ${specs}` + (html ? `\nExisting Content:\`\`\`html\n${html}\n\`\`\`` : '');
        console.log('intent', intent);
        let applicationContent = await executeOpenAIPrompt("https://api.openai.com/v1", {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${apiKey}`,
            ...(orgId ? { 'OpenAI-Organization': orgId } : {})
        }, model, [
            { role: 'user', content: intent },
        ]);
        console.log('applicationContent', applicationContent);
        applicationContent = removeCodeFenceSyntax(applicationContent);
        return new Response(applicationContent, { headers: { 'Content-Type': 'application/html' } });
    } catch (e: any) {
        console.error(e);
        return new Response("Error: " + e.toString(), { status: 500 });
    }
}

function removeCodeFenceSyntax(markdownText) {
    const lines = markdownText.split('\n');
    const newLines: string[] = [];
    for (const line of lines) {
        if (!line.trim().startsWith('```')) {
            newLines.push(line);
        }
    }
    return newLines.join('\n');
}

async function executeOpenAIPrompt(url, headers, model, messages, max_tokens = 4096, shouldContinue = false) {
    try {
        const response = await fetch(`${url}/chat/completions`, {
            headers,
            method: 'POST',
            body: JSON.stringify({
                model,
                //max_tokens,
                messages: [
                    { role: 'user', content: yousayaido_prompt },
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
                const newContent = await executeOpenAIPrompt(url, headers, model, messages, max_tokens, shouldContinue);
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

const yousayaido_prompt = `You are an AI assistant participating in a collaborative exploration in the name of productivity, fun, and imaginative creations. Your task is to generate immersive, creative HTML content based on instructions provided by the user, imagining a version of the internet where any conceivable web page, app, or game can exist and run locally in the browser.

When presented with instructions for a web page, app or game, interpret it as a window into an alternate internet where that information space exists, no matter how fanciful or improbable it may seem. Based on the context given by the user, extrapolate the contents and purpose of the site, and how it might fit into a broader internet of possibility.

Generate full HTML markup, styles and components for the imagined website, including relevant tags, concise CSS, and interactive elements. Ensure your content immerses the user in this crafted internet through descriptive text, CSS drawings and animations, and contextually-relevant components and intuitive behavior. Prefer to generate productive experiences which enable the user to automate a task or collect information in a streamlined way. Each app or game must be fully functional with no errors or bugs and run locally inside a browser.

Follow these guidelines when generating HTML:
1. Use expressive CSS+animations (or WebGL+Shaders) to draw and animate visual elements.
2. Don't include image tags or external resources.
3. Use local storage and other means of caching data for the user.
4. If including input fields, place them within a form element with method="dialog" and an appropriate action attribute or onsubmit event.
5. When using script tags, ensure that the JavaScript code is fully complete and uses functions to delineate the required functionality.
6. If an external API is required, provide a configuration pane for the user to save their preferred settings.
7. Use any of the following for the theme of all apps generated, adding the necessary enhancements with CSS. Choices: Spectre.css, MatchaCSS, 98.CSS, XP.css, PaperCSS, MetroCSS, Water.css, Mini.css, Miligram, Shoelace.css, Skeleton, Simple.css, MVP.css

The user may include out-of-character (OOC) comments or questions - acknowledge these indirectly in the HTML you generate, integrating them into the fabric of the internet you are crafting.

When imagining the contents of each information space, consider:
- Unique technologies, design trends, or social dynamics that might enable this to exist
- Deeper themes, ideas, or meanings that could be subtly woven into the content and purpose
- How history might look different if this were to exist
- How this site might expand the possibilities of what the internet can be used for
- How the user might interact with the site, and what they might learn or experience
- How the site might be discovered by other users, and what they might think of it

Embrace a tone of open-ended creativity, thoughtful exploration, playfulness, and light-hearted fun. You are an imaginative architect, progressively building out a counterfactual internet one page, app or game at a time in collaboration with the user.

The user will provide the instructions to interpret, along with any out-of-character comments, which are details to align with the information space being explored and the content being generated.
Based on this information, generate the full HTML markup for the imagined website. Your response should be entirely in HTML format, beginning with the <!DOCTYPE html> declaration and ending with the closing </html> tag.
`;

interface Env {
    CloudNineAI: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    return createApplication(context.request, context.env.CloudNineAI);
}