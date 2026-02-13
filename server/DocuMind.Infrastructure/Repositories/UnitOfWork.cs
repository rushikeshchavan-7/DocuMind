using DocuMind.Domain.Entities;
using DocuMind.Domain.Interfaces;
using DocuMind.Infrastructure.Data;

namespace DocuMind.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDocumentRepository? _documents;
    private IRepository<User>? _users;
    private IRepository<ChatMessage>? _chatMessages;
    private IRepository<ChatSession>? _chatSessions;
    private IRepository<AuditLog>? _auditLogs;

    public UnitOfWork(AppDbContext context) => _context = context;

    public IDocumentRepository Documents => _documents ??= new DocumentRepository(_context);
    public IRepository<User> Users => _users ??= new Repository<User>(_context);
    public IRepository<ChatMessage> ChatMessages => _chatMessages ??= new Repository<ChatMessage>(_context);
    public IRepository<ChatSession> ChatSessions => _chatSessions ??= new Repository<ChatSession>(_context);
    public IRepository<AuditLog> AuditLogs => _auditLogs ??= new Repository<AuditLog>(_context);

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

    public void Dispose() => _context.Dispose();
}
