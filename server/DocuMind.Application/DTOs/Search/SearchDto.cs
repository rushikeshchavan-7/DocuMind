namespace DocuMind.Application.DTOs.Search;

public class SearchRequest
{
    public string Query { get; set; } = string.Empty;
}

public class SearchResultDto
{
    public Guid DocumentId { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public double Score { get; set; }
}
