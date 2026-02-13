namespace DocuMind.Application.DTOs.Documents;

public class DocumentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Status { get; set; } = string.Empty;
    public int PageCount { get; set; }
    public DateTime UploadedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public int ChatMessageCount { get; set; }
}

public class DocumentDetailDto : DocumentDto
{
    public string? ExtractedText { get; set; }
    public List<ChatMessageDto> RecentMessages { get; set; } = new();
}

public class ChatMessageDto
{
    public Guid Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
