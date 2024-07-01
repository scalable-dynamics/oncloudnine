export class TextCompletionService implements ITextCompletionService {

    static Connection: ConnectorType = 'openai';

    get name() {
        return this.connector;
    }

    constructor(private connector:  'chat' | 'knowledge' | 'tools' | 'data' | 'image' | 'audio' | 'search' | 'task' | 'document', public promptExtension: string, private initial_tokens: number = 250) { }

    async getTextCompletion(text: string, messages: IConversationMessage[], context: string[], max_tokens?: number | undefined) {
        if (!max_tokens) max_tokens = this.initial_tokens;
        const response = await fetch(`/api/connector`, {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify({
                connection: TextCompletionService.Connection === 'openai' ? 'openai' : 'claude',
                type: this.connector,
                max_tokens: Math.min(4096, max_tokens),
                text,
                context: [
                    ...(context || []),
                    this.promptExtension || ''
                ],
                messages
            })
        });
        return await response.text();
    }
}