using System.Security.Claims;
using DocuMind.Application.DTOs.Chat;
using DocuMind.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocuMind.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService) => _chatService = chatService;

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> Ask([FromBody] ChatRequest request)
    {
        try
        {
            var response = await _chatService.AskAsync(request, GetUserId());
            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = $"AI Engine unreachable: {ex.Message}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Chat error: {ex.Message}" });
        }
    }

    // --- Session Endpoints ---

    [HttpGet("sessions/{documentId:guid}")]
    public async Task<IActionResult> GetSessions(Guid documentId)
    {
        try
        {
            var sessions = await _chatService.GetSessionsAsync(documentId, GetUserId());
            return Ok(sessions);
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
    {
        try
        {
            var session = await _chatService.CreateSessionAsync(request.DocumentId, GetUserId(), request.Title);
            return Ok(session);
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
    }

    [HttpDelete("sessions/{sessionId:guid}")]
    public async Task<IActionResult> DeleteSession(Guid sessionId)
    {
        try
        {
            await _chatService.DeleteSessionAsync(sessionId, GetUserId());
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
    }

    [HttpGet("{sessionId:guid}/history")]
    public async Task<IActionResult> GetHistory(Guid sessionId)
    {
        try
        {
            var messages = await _chatService.GetHistoryAsync(sessionId, GetUserId());
            return Ok(messages);
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
    }
}
