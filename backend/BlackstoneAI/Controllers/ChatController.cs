using BlackstoneAI.Models;
using BlackstoneAI.Services;
using Microsoft.AspNetCore.Mvc;

namespace BlackstoneAI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController(ChatQueueService queue) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Post([FromBody] ChatRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { error = "message required" });

        var correlationId = Guid.NewGuid().ToString();
        var request = new ChatRequest(correlationId, dto.UserId ?? "anonymous", dto.Message.Trim());

        try
        {
            var response = await queue.SendAsync(request, TimeSpan.FromSeconds(30));
            if (response.Error is not null)
                return StatusCode(503, new { error = response.Error });

            return Ok(new { content = response.Content });
        }
        catch (TimeoutException)
        {
            return StatusCode(503, new { error = "AI service timed out. Please try again." });
        }
    }

    public record ChatRequestDto(string? UserId, string Message);
}
