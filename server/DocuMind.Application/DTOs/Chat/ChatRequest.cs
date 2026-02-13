using System.ComponentModel.DataAnnotations;

namespace DocuMind.Application.DTOs.Chat;

public class ChatRequest
{
    [Required]
    public Guid DocumentId { get; set; }

    public Guid? SessionId { get; set; }

    [Required, StringLength(2000)]
    public string Message { get; set; } = string.Empty;
}
