using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DocuMind.Application.DTOs.Auth;
using DocuMind.Application.Interfaces;
using DocuMind.Domain.Entities;
using DocuMind.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DocuMind.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public AuthService(IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUsers = await _unitOfWork.Users.FindAsync(u => u.Email == request.Email);
        if (existingUsers.Any())
            throw new InvalidOperationException("A user with this email already exists.");

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12),
            Role = "User"
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return GenerateAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var users = await _unitOfWork.Users.FindAsync(u => u.Email == request.Email.ToLowerInvariant());
        var user = users.FirstOrDefault();

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated.");

        user.LastLoginAt = DateTime.UtcNow;
        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return GenerateAuthResponse(user);
    }

    public Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        throw new NotImplementedException("Refresh token logic to be implemented with Redis/DB storage.");
    }

    private AuthResponse GenerateAuthResponse(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"] ?? "DocuMind-SuperSecret-JWT-Key-2024-Must-Be-At-Least-32-Bytes!");
        var expires = DateTime.UtcNow.AddHours(24);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Expires = expires,
            Issuer = _configuration["Jwt:Issuer"] ?? "DocuMind",
            Audience = _configuration["Jwt:Audience"] ?? "DocuMind-Client",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return new AuthResponse
        {
            Token = tokenHandler.WriteToken(token),
            RefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = expires,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role
            }
        };
    }
}
