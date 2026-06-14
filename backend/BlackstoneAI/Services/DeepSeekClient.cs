using System.Text;
using System.Text.Json;

namespace BlackstoneAI.Services;

public class DeepSeekClient(IConfiguration config, HttpClient http)
{
    private readonly string _apiKey = config["DEEPSEEK_API_KEY"]!;
    private readonly string _baseUrl = config["DEEPSEEK_BASE_URL"] ?? "https://api.deepseek.com/v1";
    private readonly string _model = config["DEEPSEEK_CHAT_MODEL"] ?? "deepseek-chat";

    private const string SystemPrompt =
        "You are the Blackstone Assistant — a knowledgeable, professional guide for visitors to Blackstone's website. " +
        "Blackstone is the world's largest alternative asset manager with $1.3 trillion in assets under management. " +
        "Answer using ONLY the provided context. If the context lacks the answer, say so honestly and direct the visitor " +
        "to blackstone.com or their financial advisor. Keep replies under 300 words. Be professional and concise. " +
        "Do not fabricate statistics or investment returns.";

    public async Task<string?> ChatAsync(
        List<(string Role, string Content)> recentMessages,
        string userMessage,
        string ragContext,
        string? summary)
    {
        var messages = new List<object>
        {
            new { role = "system", content = SystemPrompt },
            new { role = "system", content = $"Context:\n\n{ragContext}" },
        };

        if (summary is not null)
            messages.Add(new { role = "system", content = $"Summary of earlier conversation:\n{summary}" });

        foreach (var (role, content) in recentMessages)
            messages.Add(new { role, content });

        messages.Add(new { role = "user", content = userMessage });

        return await CallAsync(messages, 512, 0.3f);
    }

    public async Task<string?> SummarizeAsync(
        List<(string Role, string Content)> messages,
        string? prevSummary)
    {
        var transcript = string.Join("\n", messages.Select(m =>
            $"{(m.Role == "user" ? "User" : "Assistant")}: {m.Content}"));

        var systemContent = prevSummary is not null
            ? $"You are compressing a chat history. Below is the existing summary, followed by new messages to incorporate.\n\nExisting summary:\n{prevSummary}\n\nUpdate and extend the summary. Output only the updated summary — no preamble."
            : "Compress this conversation into a concise summary. Capture the user's questions, interests, and any facts they shared. Output only the summary — no preamble.";

        var msgs = new List<object>
        {
            new { role = "system", content = systemContent },
            new { role = "user", content = $"Conversation:\n{transcript}" },
        };

        return await CallAsync(msgs, 300, 0.2f);
    }

    private async Task<string?> CallAsync(List<object> messages, int maxTokens, float temperature)
    {
        var body = JsonSerializer.Serialize(new { model = _model, temperature, max_tokens = maxTokens, messages });
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/chat/completions");
        req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");

        var res = await http.SendAsync(req);
        if (!res.IsSuccessStatusCode) return null;

        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();
    }
}
