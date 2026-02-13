using DocuMind.Domain.Entities;
using DocuMind.Domain.Interfaces;
using DocuMind.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DocuMind.Infrastructure.Repositories;

public class DocumentRepository : Repository<Document>, IDocumentRepository
{
    public DocumentRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Document>> GetByUserIdAsync(Guid userId) =>
        await _dbSet.Where(d => d.UserId == userId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();

    public async Task<Document?> GetWithMessagesAsync(Guid documentId) =>
        await _dbSet.Include(d => d.ChatMessages.OrderByDescending(m => m.Timestamp).Take(50))
            .FirstOrDefaultAsync(d => d.Id == documentId);
}
