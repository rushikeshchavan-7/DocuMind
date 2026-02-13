namespace DocuMind.Application.Interfaces;

public interface IAiEngineClient
{
    Task<string> ProcessDocumentAsync(Guid documentId, byte[] rawFileBytes, string fileName);
    Task<AiChatResponse> ChatAsync(Guid documentId, string question);
    Task<List<AiSearchResult>> SearchAsync(string query, int topK = 10);
}

public class AiChatResponse
{
    public string Answer { get; set; } = string.Empty;
    public List<string> Sources { get; set; } = new();
}

public class AiSearchResult
{
    public string DocumentId { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public double Score { get; set; }
}
