using DocuMind.Domain.Entities;

namespace DocuMind.Domain.Interfaces;

public interface IDocumentRepository : IRepository<Document>
{
    Task<IEnumerable<Document>> GetByUserIdAsync(Guid userId);
    Task<Document?> GetWithMessagesAsync(Guid documentId);
}
