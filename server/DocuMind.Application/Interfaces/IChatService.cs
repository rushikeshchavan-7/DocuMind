using DocuMind.Application.DTOs.Chat;

namespace DocuMind.Application.Interfaces;

public interface IChatService
{
    Task<ChatResponse> AskAsync(ChatRequest request, Guid userId);
    Task<IEnumerable<DTOs.Documents.ChatMessageDto>> GetHistoryAsync(Guid sessionId, Guid userId);

    // Chat session management
    Task<IEnumerable<ChatSessionDto>> GetSessionsAsync(Guid documentId, Guid userId);
    Task<ChatSessionDto> CreateSessionAsync(Guid documentId, Guid userId, string? title = null);
    Task DeleteSessionAsync(Guid sessionId, Guid userId);
}
