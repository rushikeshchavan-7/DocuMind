using DocuMind.Application.DTOs.Documents;
using Microsoft.AspNetCore.Http;

namespace DocuMind.Application.Interfaces;

public interface IDocumentService
{
    Task<DocumentDto> UploadAsync(IFormFile file, Guid userId);
    Task<IEnumerable<DocumentDto>> GetUserDocumentsAsync(Guid userId);
    Task<DocumentDetailDto?> GetDocumentDetailAsync(Guid documentId, Guid userId);
    Task DeleteAsync(Guid documentId, Guid userId);
    Task<byte[]> DownloadAsync(Guid documentId, Guid userId);
}
