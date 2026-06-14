using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace BlackstoneAI.Services;

public class QdrantService(IConfiguration config)
{
    private const string Collection = "blackstone-knowledge";
    private const uint VectorSize = 512; // CLIP ViT-B/16 text encoder output

    private QdrantClient CreateClient()
    {
        var host = config["QDRANT_HOST"] ?? "localhost";
        var port = int.Parse(config["QDRANT_PORT"] ?? "6334");
        return new QdrantClient(host, port);
    }

    public async Task EnsureCollectionAsync()
    {
        using var client = CreateClient();
        var collections = await client.ListCollectionsAsync();
        if (collections.Any(c => c == Collection)) return;

        await client.CreateCollectionAsync(Collection,
            new VectorParams { Size = VectorSize, Distance = Distance.Cosine });
    }

    public async Task UpsertAsync(string id, float[] vector, string source, string category, string content)
    {
        using var client = CreateClient();
        await client.UpsertAsync(Collection,
        [
            new PointStruct
            {
                Id = new PointId { Uuid = id },
                Vectors = vector,
                Payload =
                {
                    ["source"]   = source,
                    ["category"] = category,
                    ["content"]  = content,
                }
            }
        ]);
    }

    public async Task<long> CountAsync()
    {
        using var client = CreateClient();
        var info = await client.GetCollectionInfoAsync(Collection);
        return (long)info.PointsCount;
    }

    public async Task<List<(string category, string content, float score)>> SearchAsync(float[] queryVector, int topK = 6)
    {
        using var client = CreateClient();
        var results = await client.SearchAsync(Collection, queryVector, limit: (ulong)topK, scoreThreshold: 0.1f,
            payloadSelector: true);

        return results.Select(r => (
            r.Payload["category"].StringValue,
            r.Payload["content"].StringValue,
            r.Score
        )).ToList();
    }
}
