namespace DocuMind.Domain.Entities;

public class ChatSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = "New Chat";
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
