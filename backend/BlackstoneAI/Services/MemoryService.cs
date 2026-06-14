using Npgsql;

namespace BlackstoneAI.Services;

public record MemoryContext(string? Summary, List<(string Role, string Content)> RecentMessages);

public class MemoryService(IConfiguration config, DeepSeekClient ai)
{
    private readonly string _connStr = BuildConnStr(config["DATABASE_URL"]!);

    public static string ParseConnStr(string url) => BuildConnStr(url);

    private static string BuildConnStr(string url)
    {
        // Parse URI manually and emit key=value format Npgsql always accepts
        var uri = new Uri(url.Replace("postgresql://", "https://"));
        var userInfo = uri.UserInfo.Split(':', 2);
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var db = uri.AbsolutePath.TrimStart('/');
        var user = Uri.UnescapeDataString(userInfo[0]);
        var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        return $"Host={host};Port={port};Database={db};Username={user};Password={pass}";
    }
    private const int RecentWindow = 10;
    private const int SummarizeAfter = 20;

    public async Task InitSchemaAsync()
    {
        await using var conn = new NpgsqlConnection(_connStr);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(@"
            CREATE TABLE IF NOT EXISTS user_conversations (
                id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id    TEXT NOT NULL,
                role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content    TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS user_conversations_user_id_idx
                ON user_conversations (user_id, created_at);
            CREATE TABLE IF NOT EXISTS user_summaries (
                user_id    TEXT PRIMARY KEY,
                summary    TEXT NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT now()
            );
            CREATE TABLE IF NOT EXISTS knowledge_chunks (
                id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                source     TEXT NOT NULL,
                category   TEXT NOT NULL,
                content    TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT now()
            );", conn);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<MemoryContext> GetContextAsync(string userId)
    {
        await using var conn = new NpgsqlConnection(_connStr);
        await conn.OpenAsync();

        string? summary = null;
        await using (var cmd = new NpgsqlCommand(
            "SELECT summary FROM user_summaries WHERE user_id = $1", conn))
        {
            cmd.Parameters.AddWithValue(userId);
            var result = await cmd.ExecuteScalarAsync();
            summary = result as string;
        }

        var messages = new List<(string, string)>();
        await using (var cmd = new NpgsqlCommand(
            @"SELECT role, content FROM user_conversations
              WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2", conn))
        {
            cmd.Parameters.AddWithValue(userId);
            cmd.Parameters.AddWithValue(RecentWindow);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                messages.Add((reader.GetString(0), reader.GetString(1)));
        }

        messages.Reverse(); // chronological
        return new MemoryContext(summary, messages);
    }

    public async Task SaveAndCompressAsync(string userId, string userMsg, string assistantMsg)
    {
        await using var conn = new NpgsqlConnection(_connStr);
        await conn.OpenAsync();

        await using (var cmd = new NpgsqlCommand(
            @"INSERT INTO user_conversations (user_id, role, content) VALUES
              ($1, 'user', $2), ($1, 'assistant', $3)", conn))
        {
            cmd.Parameters.AddWithValue(userId);
            cmd.Parameters.AddWithValue(userMsg);
            cmd.Parameters.AddWithValue(assistantMsg);
            await cmd.ExecuteNonQueryAsync();
        }

        long total;
        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM user_conversations WHERE user_id = $1", conn))
        {
            cmd.Parameters.AddWithValue(userId);
            total = (long)(await cmd.ExecuteScalarAsync())!;
        }

        if (total > SummarizeAfter)
            await CompressAsync(conn, userId, (int)total);
    }

    private async Task CompressAsync(NpgsqlConnection conn, string userId, int total)
    {
        int toSummarize = total - RecentWindow;

        var oldMsgs = new List<(string Id, string Role, string Content)>();
        await using (var cmd = new NpgsqlCommand(
            @"SELECT id, role, content FROM user_conversations
              WHERE user_id = $1 ORDER BY created_at ASC LIMIT $2", conn))
        {
            cmd.Parameters.AddWithValue(userId);
            cmd.Parameters.AddWithValue(toSummarize);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                oldMsgs.Add((reader.GetString(0), reader.GetString(1), reader.GetString(2)));
        }

        if (oldMsgs.Count == 0) return;

        string? prevSummary = null;
        await using (var cmd = new NpgsqlCommand(
            "SELECT summary FROM user_summaries WHERE user_id = $1", conn))
        {
            cmd.Parameters.AddWithValue(userId);
            prevSummary = await cmd.ExecuteScalarAsync() as string;
        }

        var newSummary = await ai.SummarizeAsync(oldMsgs.Select(m => (m.Role, m.Content)).ToList(), prevSummary);
        if (newSummary is null) return;

        var ids = oldMsgs.Select(m => Guid.Parse(m.Id)).ToArray();

        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            await using (var cmd = new NpgsqlCommand(
                @"INSERT INTO user_summaries (user_id, summary, updated_at) VALUES ($1, $2, now())
                  ON CONFLICT (user_id) DO UPDATE SET summary = $2, updated_at = now()", conn, tx))
            {
                cmd.Parameters.AddWithValue(userId);
                cmd.Parameters.AddWithValue(newSummary);
                await cmd.ExecuteNonQueryAsync();
            }

            await using (var cmd = new NpgsqlCommand(
                "DELETE FROM user_conversations WHERE id = ANY($1)", conn, tx))
            {
                cmd.Parameters.AddWithValue(ids);
                await cmd.ExecuteNonQueryAsync();
            }

            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
