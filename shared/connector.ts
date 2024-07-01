type ConnectorType = 'openai' | 'claude';

interface ITextCompletionService {
    name: string;
    model?: string;
    systemPrompt?: string;
    getTextCompletion(text: string, messages: IConversationMessage[], context: string[], max_tokens?: number | undefined): Promise<string>;
}

interface VectorEmbedding {
    embedding: number[];
    text: string;
}

interface ITextEmbeddingService {
    getEmbeddings(input: string[]): Promise<VectorEmbedding[]>;
}

interface IImageDescriptionService {
    getImageDescription(image_url: string, input: string, messages: IConversationMessage[], context: string[], max_tokens: number): Promise<string>;
}

interface ISpeechGenerationService {
    getSpeechGeneration(input: string, voice: string, speed: number): Promise<Blob>;
}

interface ISpeechTranscriptionService {
    getSpeechTranscription(audioBlob: Blob, previousTranscript: string, temperature?: number): Promise<{ transcript: string }>;
}

interface ISearchResult {
    title: string;
    type?: string;
    summary?: string;
    url?: string;
    relevance?: number;
    image?: {
        url: string;
        width?: number;
        height?: number;
    };
    thumbnail?: {
        url: string;
        width?: number;
        height?: number;
    };
}

interface ISearchProvider {
    search(query: string, max_count: number): Promise<ISearchResult[]>;
}