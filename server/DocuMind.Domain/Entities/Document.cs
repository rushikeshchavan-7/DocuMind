namespace DocuMind.Domain.Entities;

public class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? ExtractedText { get; set; }
    public string Status { get; set; } = "Uploaded"; // Uploaded, Processing, Ready, Failed
    public int PageCount { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();
}
