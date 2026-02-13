namespace DocuMind.Application.Interfaces;

public interface IEncryptionService
{
    byte[] Encrypt(byte[] data);
    byte[] Decrypt(byte[] encryptedData);
    string EncryptString(string plainText);
    string DecryptString(string cipherText);
}
