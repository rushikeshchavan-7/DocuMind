namespace DocuMind.Application.DTOs.Dashboard;

public class DashboardDto
{
    public int TotalDocuments { get; set; }
    public int ProcessedDocuments { get; set; }
    public int TotalChats { get; set; }
    public long TotalStorageUsed { get; set; }
    public List<RecentActivityDto> RecentActivity { get; set; } = new();
    public List<DocumentDto> RecentDocuments { get; set; } = new();
}

public class RecentActivityDto
{
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class DocumentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}
