using DocuMind.Application.DTOs.Chat;
using DocuMind.Application.DTOs.Documents;
using DocuMind.Application.Interfaces;
using DocuMind.Domain.Entities;
using DocuMind.Domain.Interfaces;

namespace DocuMind.Infrastructure.Services;

public class ChatService : IChatService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAiEngineClient _aiEngineClient;

    public ChatService(IUnitOfWork unitOfWork, IAiEngineClient aiEngineClient)
    {
        _unitOfWork = unitOfWork;
        _aiEngineClient = aiEngineClient;
    }

    public async Task<ChatResponse> AskAsync(ChatRequest request, Guid userId)
    {
        var document = await _unitOfWork.Documents.GetByIdAsync(request.DocumentId);
        if (document == null || document.UserId != userId)
            throw new UnauthorizedAccessException("Document not found or access denied.");

        if (document.Status != "Ready")
            throw new InvalidOperationException("Document is still being processed.");

        // Auto-create session if none specified
        Guid sessionId;
        if (request.SessionId.HasValue && request.SessionId.Value != Guid.Empty)
        {
            sessionId = request.SessionId.Value;
            var session = await _unitOfWork.ChatSessions.GetByIdAsync(sessionId);
            if (session == null || session.UserId != userId)
                throw new UnauthorizedAccessException("Session not found.");
        }
        else
        {
            // Create a new session with the first message as title
            var title = request.Message.Length > 60
                ? request.Message[..60] + "..."
                : request.Message;
            var newSession = new ChatSession
            {
                Title = title,
                DocumentId = request.DocumentId,
                UserId = userId,
            };
            await _unitOfWork.ChatSessions.AddAsync(newSession);
            await _unitOfWork.SaveChangesAsync();
            sessionId = newSession.Id;
        }

        // Save user message
        var userMessage = new ChatMessage
        {
            Role = "user",
            Content = request.Message,
            DocumentId = request.DocumentId,
            UserId = userId,
            ChatSessionId = sessionId,
        };
        await _unitOfWork.ChatMessages.AddAsync(userMessage);

        // Get AI response
        var aiResponse = await _aiEngineClient.ChatAsync(request.DocumentId, request.Message);

        // Save assistant message
        var assistantMessage = new ChatMessage
        {
            Role = "assistant",
            Content = aiResponse.Answer,
            DocumentId = request.DocumentId,
            UserId = userId,
            ChatSessionId = sessionId,
        };
        await _unitOfWork.ChatMessages.AddAsync(assistantMessage);

        // Update session timestamp
        var currentSession = await _unitOfWork.ChatSessions.GetByIdAsync(sessionId);
        if (currentSession != null)
        {
            currentSession.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.ChatSessions.UpdateAsync(currentSession);
        }

        await _unitOfWork.SaveChangesAsync();

        return new ChatResponse
        {
            Response = aiResponse.Answer,
            Sources = aiResponse.Sources,
            SessionId = sessionId,
        };
    }

    public async Task<IEnumerable<ChatMessageDto>> GetHistoryAsync(Guid sessionId, Guid userId)
    {
        var session = await _unitOfWork.ChatSessions.GetByIdAsync(sessionId);
        if (session == null || session.UserId != userId)
            throw new UnauthorizedAccessException("Session not found or access denied.");

        var messages = await _unitOfWork.ChatMessages.FindAsync(m => m.ChatSessionId == sessionId);
        return messages.OrderBy(m => m.Timestamp).Select(m => new ChatMessageDto
        {
            Id = m.Id,
            Role = m.Role,
            Content = m.Content,
            Timestamp = m.Timestamp
        });
    }

    // --- Session Management ---

    public async Task<IEnumerable<ChatSessionDto>> GetSessionsAsync(Guid documentId, Guid userId)
    {
        var document = await _unitOfWork.Documents.GetByIdAsync(documentId);
        if (document == null || document.UserId != userId)
            throw new UnauthorizedAccessException("Document not found or access denied.");

        var sessions = await _unitOfWork.ChatSessions.FindAsync(s => s.DocumentId == documentId && s.UserId == userId);
        var chatMessages = await _unitOfWork.ChatMessages.FindAsync(m => m.DocumentId == documentId && m.ChatSessionId != null);
        var messageCounts = chatMessages.GroupBy(m => m.ChatSessionId).ToDictionary(g => g.Key!.Value, g => g.Count());

        return sessions.OrderByDescending(s => s.UpdatedAt).Select(s => new ChatSessionDto
        {
            Id = s.Id,
            Title = s.Title,
            DocumentId = s.DocumentId,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt,
            MessageCount = messageCounts.GetValueOrDefault(s.Id, 0),
        });
    }

    public async Task<ChatSessionDto> CreateSessionAsync(Guid documentId, Guid userId, string? title = null)
    {
        var document = await _unitOfWork.Documents.GetByIdAsync(documentId);
        if (document == null || document.UserId != userId)
            throw new UnauthorizedAccessException("Document not found or access denied.");

        var session = new ChatSession
        {
            Title = title ?? "New Chat",
            DocumentId = documentId,
            UserId = userId,
        };
        await _unitOfWork.ChatSessions.AddAsync(session);
        await _unitOfWork.SaveChangesAsync();

        return new ChatSessionDto
        {
            Id = session.Id,
            Title = session.Title,
            DocumentId = session.DocumentId,
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt,
            MessageCount = 0,
        };
    }

    public async Task DeleteSessionAsync(Guid sessionId, Guid userId)
    {
        var session = await _unitOfWork.ChatSessions.GetByIdAsync(sessionId);
        if (session == null || session.UserId != userId)
            throw new UnauthorizedAccessException("Session not found or access denied.");

        // Delete all messages in this session
        var messages = await _unitOfWork.ChatMessages.FindAsync(m => m.ChatSessionId == sessionId);
        foreach (var msg in messages)
            await _unitOfWork.ChatMessages.DeleteAsync(msg);

        await _unitOfWork.ChatSessions.DeleteAsync(session);
        await _unitOfWork.SaveChangesAsync();
    }
}
