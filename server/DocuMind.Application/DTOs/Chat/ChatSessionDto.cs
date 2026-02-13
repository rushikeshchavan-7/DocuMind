namespace DocuMind.Application.DTOs.Chat;

public class ChatSessionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid DocumentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int MessageCount { get; set; }
}

public class CreateSessionRequest
{
    public Guid DocumentId { get; set; }
    public string? Title { get; set; }
}
