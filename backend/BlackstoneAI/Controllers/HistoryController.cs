using BlackstoneAI.Services;
using Microsoft.AspNetCore.Mvc;

namespace BlackstoneAI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HistoryController(MemoryService memory) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return BadRequest(new { error = "userId required" });

        var ctx = await memory.GetContextAsync(userId);
        var messages = ctx.RecentMessages.Select(m => new { role = m.Role, content = m.Content });
        return Ok(new { messages });
    }
}
