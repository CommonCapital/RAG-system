namespace BlackstoneAI.Services;

public class RetrievalService(EmbeddingService embeddings, QdrantService qdrant)
{
    public async Task<string> RetrieveContextAsync(string query)
    {
        var vector = await embeddings.EmbedAsync(query);
        var results = await qdrant.SearchAsync(vector, topK: 6);

        if (results.Count == 0) return "";

        return string.Join("\n\n", results.Select((r, i) =>
            $"[{i + 1}] ({r.category}) {r.content.Trim()}"));
    }
}
