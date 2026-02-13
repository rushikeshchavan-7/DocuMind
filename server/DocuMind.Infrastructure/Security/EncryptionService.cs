using System.Security.Cryptography;
using System.Text;
using DocuMind.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace DocuMind.Infrastructure.Security;

public class EncryptionService : IEncryptionService
{
    private readonly byte[] _key;
    private readonly byte[] _iv;

    public EncryptionService(IConfiguration configuration)
    {
        var encryptionKey = configuration["Security:EncryptionKey"] ?? "DocuMind-AES256-SecureKey-2024!!";
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(encryptionKey));
        _iv = MD5.HashData(Encoding.UTF8.GetBytes(encryptionKey));
    }

    public byte[] Encrypt(byte[] data)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;
        using var encryptor = aes.CreateEncryptor();
        return encryptor.TransformFinalBlock(data, 0, data.Length);
    }

    public byte[] Decrypt(byte[] encryptedData)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;
        using var decryptor = aes.CreateDecryptor();
        return decryptor.TransformFinalBlock(encryptedData, 0, encryptedData.Length);
    }

    public string EncryptString(string plainText) =>
        Convert.ToBase64String(Encrypt(Encoding.UTF8.GetBytes(plainText)));

    public string DecryptString(string cipherText) =>
        Encoding.UTF8.GetString(Decrypt(Convert.FromBase64String(cipherText)));
}
