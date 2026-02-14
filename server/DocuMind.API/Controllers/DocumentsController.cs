using System.Security.Claims;
using DocuMind.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocuMind.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService) => _documentService = documentService;

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("upload")]
    [RequestSizeLimit(52_428_800)] // 50MB
    public async Task<IActionResult> Upload(IFormFile file)
    {
        try
        {
            var result = await _documentService.UploadAsync(file, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var documents = await _documentService.GetUserDocumentsAsync(GetUserId());
        return Ok(documents);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var document = await _documentService.GetDocumentDetailAsync(id, GetUserId());
        return document == null ? NotFound() : Ok(document);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _documentService.DeleteAsync(id, GetUserId());
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id:guid}/reprocess")]
    public async Task<IActionResult> Reprocess(Guid id)
    {
        try
        {
            await _documentService.ReprocessAsync(id, GetUserId());
            return Ok(new { message = "Document re-indexed successfully." });
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
        catch (FileNotFoundException)
        {
            return BadRequest(new { message = "Original file not found on server. Please delete and re-upload." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Reprocess failed: {ex.Message}" });
        }
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        try
        {
            var document = await _documentService.GetDocumentDetailAsync(id, GetUserId());
            if (document == null) return NotFound();

            var bytes = await _documentService.DownloadAsync(id, GetUserId());
            return File(bytes, document.ContentType, document.FileName);
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
    }
}
