using System.Net.Http.Json;
using DocuMind.Application.Interfaces;

namespace DocuMind.Infrastructure.Services;

public class AiEngineClient : IAiEngineClient
{
    private readonly HttpClient _httpClient;

    public AiEngineClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string> ProcessDocumentAsync(Guid documentId, byte[] rawFileBytes, string fileName)
    {
        var content = new MultipartFormDataContent();
        content.Add(new StringContent(documentId.ToString()), "document_id");
        content.Add(new StringContent(fileName), "file_name");
        content.Add(new ByteArrayContent(rawFileBytes), "file", fileName);

        var response = await _httpClient.PostAsync("/api/documents/process", content);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync();
    }

    public async Task<AiChatResponse> ChatAsync(Guid documentId, string question)
    {
        var response = await _httpClient.PostAsJsonAsync("/api/chat", new
        {
            document_id = documentId.ToString(),
            question
        });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AiChatResponse>() ?? new AiChatResponse { Answer = "No response from AI engine." };
    }

    public async Task<List<AiSearchResult>> SearchAsync(string query, int topK = 10)
    {
        var response = await _httpClient.PostAsJsonAsync("/api/search", new
        {
            query,
            top_k = topK
        });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<AiSearchResult>>() ?? new List<AiSearchResult>();
    }
}
