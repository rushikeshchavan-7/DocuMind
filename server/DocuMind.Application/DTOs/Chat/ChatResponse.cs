namespace DocuMind.Application.DTOs.Chat;

public class ChatResponse
{
    public string Response { get; set; } = string.Empty;
    public List<string> Sources { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Guid SessionId { get; set; }
}
