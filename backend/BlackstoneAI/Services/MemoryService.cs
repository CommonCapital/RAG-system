using Npgsql;

namespace BlackstoneAI.Services;

public record MemoryContext(string? Summary, List<(string Role, string Content)> RecentMessages);

public class MemoryService(IConfiguration config, DeepSeekClient ai)
{
    private readonly string _connStr = config["DATABASE_URL"]!;
    private const int RecentWindow = 10;
    private const int SummarizeAfter = 20;

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
