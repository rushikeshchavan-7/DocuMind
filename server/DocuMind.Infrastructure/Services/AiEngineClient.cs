using System.Net.Http.Json;
using DocuMind.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace DocuMind.Infrastructure.Services;

public class AiEngineClient : IAiEngineClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AiEngineClient> _logger;

    public AiEngineClient(HttpClient httpClient, ILogger<AiEngineClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<string> ProcessDocumentAsync(Guid documentId, byte[] rawFileBytes, string fileName)
    {
        try
        {
            _logger.LogInformation("Processing document {DocumentId} via AI Engine at {BaseUrl}", documentId, _httpClient.BaseAddress);
            var content = new MultipartFormDataContent();
            content.Add(new StringContent(documentId.ToString()), "document_id");
            content.Add(new StringContent(fileName), "file_name");
            content.Add(new ByteArrayContent(rawFileBytes), "file", fileName);

            var response = await _httpClient.PostAsync("/api/documents/process", content);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "AI Engine unreachable at {BaseUrl}", _httpClient.BaseAddress);
            throw new HttpRequestException($"AI Engine unreachable at {_httpClient.BaseAddress}: {ex.Message}", ex);
        }
    }

    public async Task<AiChatResponse> ChatAsync(Guid documentId, string question)
    {
        try
        {
            _logger.LogInformation("Chat request for doc {DocumentId} via AI Engine at {BaseUrl}", documentId, _httpClient.BaseAddress);
            var response = await _httpClient.PostAsJsonAsync("/api/chat", new
            {
                document_id = documentId.ToString(),
                question
            });

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("AI Engine returned {StatusCode}: {Body}", response.StatusCode, errorBody);
                throw new HttpRequestException($"AI Engine error ({response.StatusCode}): {errorBody}");
            }

            return await response.Content.ReadFromJsonAsync<AiChatResponse>() ?? new AiChatResponse { Answer = "No response from AI engine." };
        }
        catch (HttpRequestException ex) when (!ex.Message.Contains("AI Engine"))
        {
            _logger.LogError(ex, "AI Engine unreachable at {BaseUrl}", _httpClient.BaseAddress);
            throw new HttpRequestException($"AI Engine unreachable at {_httpClient.BaseAddress}: {ex.Message}", ex);
        }
    }

    public async Task<List<AiSearchResult>> SearchAsync(string query, int topK = 10)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/search", new
            {
                query,
                top_k = topK
            });
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<List<AiSearchResult>>() ?? new List<AiSearchResult>();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "AI Engine search failed at {BaseUrl}", _httpClient.BaseAddress);
            throw;
        }
    }
}
