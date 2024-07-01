export class TextEmbeddingService implements ITextEmbeddingService {
    async getEmbeddings(input: string[]) {
        const response = await fetch('/api/embeddings', {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify(input)
        });
        const data = await response.json();
        return data || [];
    }
}