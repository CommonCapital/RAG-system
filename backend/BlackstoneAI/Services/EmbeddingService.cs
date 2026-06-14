using System.Text;
using System.Text.Json;

namespace BlackstoneAI.Services;

/// Generates text embeddings via Ollama (local, no internet required).
/// Default model: nomic-embed-text (768-dim), excellent for text-only RAG.
public class EmbeddingService(IConfiguration config, HttpClient http)
{
    private readonly string _baseUrl = config["OLLAMA_BASE_URL"] ?? "http://localhost:11434";
    private readonly string _model   = config["OLLAMA_EMBED_MODEL"] ?? "nomic-embed-text";

    public async Task<float[]> EmbedAsync(string text)
    {
        var body = JsonSerializer.Serialize(new { model = _model, prompt = text });
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/api/embeddings");
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");

        var res = await http.SendAsync(req);
        var raw = await res.Content.ReadAsStringAsync();

        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Ollama embedding failed ({res.StatusCode}): {raw}");

        using var doc = JsonDocument.Parse(raw);
        return doc.RootElement
            .GetProperty("embedding")
            .EnumerateArray()
            .Select(e => e.GetSingle())
            .ToArray();
    }
}
