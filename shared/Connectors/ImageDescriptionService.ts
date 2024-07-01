import { TextCompletionService } from "./TextCompletionService";

export class ImageDescriptionService implements IImageDescriptionService {

    async getImageDescription(image_url: string, text: string, messages: IConversationMessage[], context: string[], max_tokens: number) {
        const response = await fetch(`/api/connector`, {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify({
                connection: TextCompletionService.Connection === 'openai' ? 'openai' : 'claude',
                type: 'image',
                max_tokens: Math.min(4096, max_tokens),
                image_url,
                text,
                context,
                messages
            })
        });
        return await response.text();
    }
}