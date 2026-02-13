using DocuMind.Application.DTOs.Documents;
using DocuMind.Application.Interfaces;
using DocuMind.Domain.Entities;
using DocuMind.Domain.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DocuMind.Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEncryptionService _encryptionService;
    private readonly IAiEngineClient _aiEngineClient;
    private readonly ILogger<DocumentService> _logger;
    private readonly string _storagePath;

    public DocumentService(
        IUnitOfWork unitOfWork,
        IEncryptionService encryptionService,
        IAiEngineClient aiEngineClient,
        IConfiguration configuration,
        ILogger<DocumentService> logger)
    {
        _unitOfWork = unitOfWork;
        _encryptionService = encryptionService;
        _aiEngineClient = aiEngineClient;
        _logger = logger;
        _storagePath = configuration["Storage:Path"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Storage", "Documents");
        Directory.CreateDirectory(_storagePath);
    }

    public async Task<DocumentDto> UploadAsync(IFormFile file, Guid userId)
    {
        if (file.Length == 0) throw new ArgumentException("File is empty.");
        if (file.Length > 50 * 1024 * 1024) throw new ArgumentException("File size exceeds 50MB limit.");

        var allowedTypes = new[] {
            "application/pdf",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/vnd.ms-powerpoint",
        };
        if (!allowedTypes.Contains(file.ContentType))
            throw new ArgumentException("Only PDF, TXT, DOCX, PPTX, and XLSX files are supported.");

        // Read raw bytes FIRST (before encryption)
        byte[] rawBytes;
        using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms);
            rawBytes = ms.ToArray();
        }

        // Encrypt and save to disk for secure storage
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(_storagePath, fileName);
        var encrypted = _encryptionService.Encrypt(rawBytes);
        await File.WriteAllBytesAsync(filePath, encrypted);

        var document = new Document
        {
            FileName = fileName,
            OriginalFileName = file.FileName,
            ContentType = file.ContentType,
            FileSize = file.Length,
            StoragePath = filePath,
            UserId = userId,
            Status = "Processing"
        };

        await _unitOfWork.Documents.AddAsync(document);
        await _unitOfWork.SaveChangesAsync();

        // Process with AI engine — send RAW bytes (not encrypted)
        try
        {
            _logger.LogInformation("Starting AI processing for document {DocId} ({FileName})", document.Id, file.FileName);
            await _aiEngineClient.ProcessDocumentAsync(document.Id, rawBytes, file.FileName);
            document.Status = "Ready";
            document.ProcessedAt = DateTime.UtcNow;
            _logger.LogInformation("AI processing complete for document {DocId}", document.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI processing failed for document {DocId}", document.Id);
            document.Status = "Failed";
        }

        await _unitOfWork.Documents.UpdateAsync(document);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(document);
    }

    public async Task<IEnumerable<DocumentDto>> GetUserDocumentsAsync(Guid userId)
    {
        var documents = await _unitOfWork.Documents.GetByUserIdAsync(userId);
        return documents.Select(MapToDto);
    }

    public async Task<DocumentDetailDto?> GetDocumentDetailAsync(Guid documentId, Guid userId)
    {
        var document = await _unitOfWork.Documents.GetWithMessagesAsync(documentId);
        if (document == null || document.UserId != userId) return null;

        return new DocumentDetailDto
        {
            Id = document.Id,
            FileName = document.OriginalFileName,
            ContentType = document.ContentType,
            FileSize = document.FileSize,
            Status = document.Status,
            PageCount = document.PageCount,
            UploadedAt = document.UploadedAt,
            ProcessedAt = document.ProcessedAt,
            ExtractedText = document.ExtractedText,
            ChatMessageCount = document.ChatMessages.Count,
            RecentMessages = document.ChatMessages.Select(m => new ChatMessageDto
            {
                Id = m.Id,
                Role = m.Role,
                Content = m.Content,
                Timestamp = m.Timestamp
            }).ToList()
        };
    }

    public async Task DeleteAsync(Guid documentId, Guid userId)
    {
        var document = await _unitOfWork.Documents.GetByIdAsync(documentId);
        if (document == null || document.UserId != userId)
            throw new UnauthorizedAccessException("Document not found or access denied.");

        if (File.Exists(document.StoragePath))
            File.Delete(document.StoragePath);

        await _unitOfWork.Documents.DeleteAsync(document);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<byte[]> DownloadAsync(Guid documentId, Guid userId)
    {
        var document = await _unitOfWork.Documents.GetByIdAsync(documentId);
        if (document == null || document.UserId != userId)
            throw new UnauthorizedAccessException("Document not found or access denied.");

        var encrypted = await File.ReadAllBytesAsync(document.StoragePath);
        return _encryptionService.Decrypt(encrypted);
    }

    private static DocumentDto MapToDto(Document doc) => new()
    {
        Id = doc.Id,
        FileName = doc.OriginalFileName,
        ContentType = doc.ContentType,
        FileSize = doc.FileSize,
        Status = doc.Status,
        PageCount = doc.PageCount,
        UploadedAt = doc.UploadedAt,
        ProcessedAt = doc.ProcessedAt,
        ChatMessageCount = doc.ChatMessages?.Count ?? 0
    };
}
