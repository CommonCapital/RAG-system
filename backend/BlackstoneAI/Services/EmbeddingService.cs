using System.Text;
using System.Text.Json;

namespace BlackstoneAI.Services;

/// Generates 512-dim text embeddings via HF Inference API using CLIP ViT-B/16.
/// The Xenova/clip-vit-base-patch16 ONNX weights are served under the canonical
/// openai/clip-vit-base-patch16 model ID on the HF inference endpoint.
public class EmbeddingService(IConfiguration config, HttpClient http)
{
    private readonly string _hfToken = config["HF_TOKEN"]!;
    private const string Model = "openai/clip-vit-base-patch16";
    private const string Endpoint = "https://api-inference.huggingface.co/pipeline/feature-extraction/";

    public async Task<float[]> EmbedAsync(string text)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{Endpoint}{Model}");
        req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _hfToken);
        req.Content = new StringContent(
            JsonSerializer.Serialize(new { inputs = text, options = new { wait_for_model = true } }),
            Encoding.UTF8, "application/json");

        var res = await http.SendAsync(req);
        var body = await res.Content.ReadAsStringAsync();

        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"HF embedding failed ({res.StatusCode}): {body}");

        // Response is a nested array: [[f32, f32, ...]] — take the first (text) vector
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // HF feature-extraction returns shape [1, 512] for a single text input
        var inner = root.ValueKind == JsonValueKind.Array && root[0].ValueKind == JsonValueKind.Array
            ? root[0]
            : root;

        return inner.EnumerateArray().Select(e => e.GetSingle()).ToArray();
    }
}
