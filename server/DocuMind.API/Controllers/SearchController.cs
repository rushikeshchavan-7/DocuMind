using System.Security.Claims;
using DocuMind.Application.DTOs.Search;
using DocuMind.Application.Interfaces;
using DocuMind.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocuMind.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly IAiEngineClient _aiEngineClient;
    private readonly IUnitOfWork _unitOfWork;

    public SearchController(IAiEngineClient aiEngineClient, IUnitOfWork unitOfWork)
    {
        _aiEngineClient = aiEngineClient;
        _unitOfWork = unitOfWork;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> Search([FromBody] SearchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest(new { message = "Query is required." });

        try
        {
            var userId = GetUserId();
            var aiResults = await _aiEngineClient.SearchAsync(request.Query);

            // Get user's documents to enrich results and filter by ownership
            var userDocs = await _unitOfWork.Documents.GetByUserIdAsync(userId);
            var docMap = userDocs.ToDictionary(d => d.Id.ToString(), d => d);

            var results = new List<SearchResultDto>();
            foreach (var r in aiResults)
            {
                if (docMap.TryGetValue(r.DocumentId, out var doc))
                {
                    results.Add(new SearchResultDto
                    {
                        DocumentId = doc.Id,
                        DocumentName = doc.OriginalFileName,
                        ContentType = doc.ContentType,
                        Snippet = r.Snippet,
                        Score = r.Score,
                    });
                }
            }

            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Search failed: {ex.Message}" });
        }
    }
}
