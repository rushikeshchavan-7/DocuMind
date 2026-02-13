using DocuMind.Domain.Entities;

namespace DocuMind.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IDocumentRepository Documents { get; }
    IRepository<User> Users { get; }
    IRepository<ChatMessage> ChatMessages { get; }
    IRepository<ChatSession> ChatSessions { get; }
    IRepository<AuditLog> AuditLogs { get; }
    Task<int> SaveChangesAsync();
}
