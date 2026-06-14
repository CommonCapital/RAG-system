namespace BlackstoneAI.Models;

public record ChatRequest(string CorrelationId, string UserId, string Message);

public record ChatResponse(string CorrelationId, string? Content, string? Error);
