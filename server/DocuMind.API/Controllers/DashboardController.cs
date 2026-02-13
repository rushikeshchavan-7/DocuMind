using System.Security.Claims;
using DocuMind.Application.DTOs.Dashboard;
using DocuMind.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocuMind.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardController(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = GetUserId();
        var documents = await _unitOfWork.Documents.GetByUserIdAsync(userId);
        var docList = documents.ToList();
        var chatMessages = await _unitOfWork.ChatMessages.FindAsync(m => m.UserId == userId);

        var dashboard = new DashboardDto
        {
            TotalDocuments = docList.Count,
            ProcessedDocuments = docList.Count(d => d.Status == "Ready"),
            TotalChats = chatMessages.Count(),
            TotalStorageUsed = docList.Sum(d => d.FileSize),
            RecentDocuments = docList.Take(5).Select(d => new Application.DTOs.Dashboard.DocumentDto
            {
                Id = d.Id,
                FileName = d.OriginalFileName,
                Status = d.Status,
                UploadedAt = d.UploadedAt
            }).ToList(),
            RecentActivity = docList.Take(10).Select(d => new RecentActivityDto
            {
                Action = "Document Upload",
                Description = $"Uploaded {d.OriginalFileName}",
                Timestamp = d.UploadedAt
            }).ToList()
        };

        return Ok(dashboard);
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics()
    {
        var userId = GetUserId();
        var documents = await _unitOfWork.Documents.GetByUserIdAsync(userId);
        var docList = documents.ToList();
        var chatMessages = await _unitOfWork.ChatMessages.FindAsync(m => m.UserId == userId);
        var msgList = chatMessages.ToList();
        var sessions = await _unitOfWork.ChatSessions.FindAsync(s => s.UserId == userId);
        var sessionList = sessions.ToList();

        // Documents by type
        var typeColors = new Dictionary<string, string>
        {
            { "application/pdf", "#ef4444" },
            { "text/plain", "#6b7280" },
            { "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "#3b82f6" },
            { "application/vnd.openxmlformats-officedocument.presentationml.presentation", "#f97316" },
            { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "#22c55e" },
        };
        var typeLabels = new Dictionary<string, string>
        {
            { "application/pdf", "PDF" },
            { "text/plain", "TXT" },
            { "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "DOCX" },
            { "application/vnd.openxmlformats-officedocument.presentationml.presentation", "PPTX" },
            { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "XLSX" },
        };

        var docsByType = docList.GroupBy(d => d.ContentType)
            .Select(g => new DocTypeCount
            {
                Type = typeLabels.GetValueOrDefault(g.Key, g.Key),
                Count = g.Count(),
                Color = typeColors.GetValueOrDefault(g.Key, "#6366f1"),
            }).ToList();

        var docsByStatus = docList.GroupBy(d => d.Status)
            .Select(g => new DocStatusCount { Status = g.Key, Count = g.Count() }).ToList();

        // Chat activity over last 7 days
        var last7Days = Enumerable.Range(0, 7).Select(i => DateTime.UtcNow.Date.AddDays(-i)).Reverse().ToList();
        var chatActivity = last7Days.Select(date => new ActivityPoint
        {
            Date = date.ToString("MMM dd"),
            Messages = msgList.Count(m => m.Timestamp.Date == date),
            Documents = docList.Count(d => d.UploadedAt.Date == date),
        }).ToList();

        // Recent chat sessions with doc names
        var docMap = docList.ToDictionary(d => d.Id);
        var recentSessions = sessionList
            .OrderByDescending(s => s.UpdatedAt)
            .Take(5)
            .Select(s => new RecentChatSession
            {
                Id = s.Id,
                Title = s.Title,
                DocumentName = docMap.TryGetValue(s.DocumentId, out var doc) ? doc.OriginalFileName : "Unknown",
                MessageCount = msgList.Count(m => m.ChatSessionId == s.Id),
                UpdatedAt = s.UpdatedAt,
            }).ToList();

        return Ok(new AnalyticsDto
        {
            TotalDocuments = docList.Count,
            ProcessedDocuments = docList.Count(d => d.Status == "Ready"),
            FailedDocuments = docList.Count(d => d.Status == "Failed"),
            TotalChatSessions = sessionList.Count,
            TotalMessages = msgList.Count,
            TotalStorageUsed = docList.Sum(d => d.FileSize),
            DocumentsByType = docsByType,
            DocumentsByStatus = docsByStatus,
            ChatActivity = chatActivity,
            RecentSessions = recentSessions,
        });
    }
}
