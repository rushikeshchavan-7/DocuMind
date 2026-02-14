using System.Text;
using DocuMind.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Add Infrastructure (Clean Architecture)
builder.Services.AddInfrastructure(builder.Configuration);

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "DocuMind-SuperSecret-JWT-Key-2024-Must-Be-At-Least-32-Bytes!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "DocuMind",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "DocuMind-Client",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
        ?? new[] { "http://localhost:4200", "https://documind-rag.netlify.app" };
    options.AddPolicy("AllowClient", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DocuMind API",
        Version = "v1",
        Description = "AI-Powered Document Intelligence Platform"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });
    c.AddSecurityRequirement(document =>
    {
        var schemeRef = new OpenApiSecuritySchemeReference("Bearer", document, null);
        return new OpenApiSecurityRequirement { [schemeRef] = [] };
    });
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(context =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User?.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
});

var app = builder.Build();

// Auto-apply database schema
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DocuMind.Infrastructure.Data.AppDbContext>();
    db.Database.EnsureCreated();
    app.Logger.LogInformation("Database schema verified successfully.");
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Failed to initialize database. Check your connection string.");
}

// Middleware pipeline
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowClient");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health / root endpoint
app.MapGet("/", () => Results.Ok(new
{
    service = "DocuMind API",
    version = "1.0.0",
    status = "running",
    docs = "/swagger",
    health = "/health"
}));

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    engine = "DocuMind API (.NET 10)",
    database = "Neon.tech PostgreSQL"
}));

app.Run();
