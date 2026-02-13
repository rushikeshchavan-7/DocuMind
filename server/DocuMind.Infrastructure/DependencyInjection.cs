using DocuMind.Application.Interfaces;
using DocuMind.Domain.Interfaces;
using DocuMind.Infrastructure.Data;
using DocuMind.Infrastructure.Repositories;
using DocuMind.Infrastructure.Security;
using DocuMind.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DocuMind.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // Repositories
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IDocumentRepository, DocumentRepository>();

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddSingleton<IEncryptionService, EncryptionService>();

        // AI Engine HTTP Client
        services.AddHttpClient<IAiEngineClient, AiEngineClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["AiEngine:BaseUrl"] ?? "http://localhost:8000");
            client.Timeout = TimeSpan.FromMinutes(5);
        });

        return services;
    }
}
