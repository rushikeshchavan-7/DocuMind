namespace DocuMind.Application.DTOs.Dashboard;

public class AnalyticsDto
{
    public int TotalDocuments { get; set; }
    public int ProcessedDocuments { get; set; }
    public int FailedDocuments { get; set; }
    public int TotalChatSessions { get; set; }
    public int TotalMessages { get; set; }
    public long TotalStorageUsed { get; set; }
    public List<DocTypeCount> DocumentsByType { get; set; } = new();
    public List<DocStatusCount> DocumentsByStatus { get; set; } = new();
    public List<ActivityPoint> ChatActivity { get; set; } = new();
    public List<RecentChatSession> RecentSessions { get; set; } = new();
}

public class DocTypeCount
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class DocStatusCount
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ActivityPoint
{
    public string Date { get; set; } = string.Empty;
    public int Messages { get; set; }
    public int Documents { get; set; }
}

public class RecentChatSession
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string DocumentName { get; set; } = string.Empty;
    public int MessageCount { get; set; }
    public DateTime UpdatedAt { get; set; }
}
