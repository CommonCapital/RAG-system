using Npgsql;

namespace BlackstoneAI.Services;

public class RetrievalService(IConfiguration config)
{
    private readonly string _connStr = MemoryService.ParseConnStr(config["DATABASE_URL"]!);
    private const int TopK = 6;

    public async Task<string> RetrieveContextAsync(string query)
    {
        await using var conn = new NpgsqlConnection(_connStr);
        await conn.OpenAsync();

        var rows = new List<(string category, string content)>();
        await using (var cmd = new NpgsqlCommand(
            "SELECT category, content FROM knowledge_chunks", conn))
        await using (var reader = await cmd.ExecuteReaderAsync())
            while (await reader.ReadAsync())
                rows.Add((reader.GetString(0), reader.GetString(1)));

        if (rows.Count == 0) return "";

        var terms = Tokenise(query);
        var scored = rows
            .Select(r => (r.category, r.content, score: Score(terms, r.content, r.category)))
            .Where(r => r.score > 0)
            .OrderByDescending(r => r.score)
            .Take(TopK)
            .ToList();

        return string.Join("\n\n", scored.Select((r, i) => $"[{i + 1}] ({r.category}) {r.content.Trim()}"));
    }

    private static List<string> Tokenise(string text) =>
        System.Text.RegularExpressions.Regex.Replace(text.ToLower(), @"[^a-z0-9\s]", " ")
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length > 2)
            .ToList();

    private static double Score(List<string> terms, string content, string category)
    {
        var target = (content + " " + category).ToLower();
        var wordSet = new HashSet<string>(target.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        double hits = 0;
        foreach (var term in terms)
        {
            if (wordSet.Contains(term)) hits += 1;
            else if (target.Contains(term)) hits += 0.5;
        }
        if (target.Contains(string.Join(" ", terms))) hits += 2;
        return hits;
    }
}
