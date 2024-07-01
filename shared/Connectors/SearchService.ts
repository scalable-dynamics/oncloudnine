export class SearchService implements ISearchProvider {
    async search(query: string, max_count: number): Promise<ISearchResult[]> {
        const response = await fetch(`/api/search`, {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify({
                query,
                max_count
            })
        });
        const data = await response.json();
        return data || [];
    }
}