package com.example.photostore.security;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Files;
import java.nio.file.Path;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import com.example.photostore.exception.StorageOperationException;

class EncryptionTest {

    private static final String TEST_MASTER_KEY = "HxWH6PWfcXhz1eueOBDIscOvxT1WdUIGA4EX5PucT8A=";

    private final Encryption encryption = new Encryption(TEST_MASTER_KEY);

    @TempDir
    Path tempDir;

    @Test
    void encryptAndDecryptRoundTripRestoresOriginalBytes() throws Exception {
        byte[] original = "any file content".getBytes();
        Path encrypted = tempDir.resolve("encrypted.bin");
        Path decrypted = tempDir.resolve("decrypted.txt");

        MockMultipartFile source = new MockMultipartFile(
                "file", "plain.txt", "text/plain", original);

        SecretKey key = encryption.generateKey();
        encryption.encryptFile(source, encrypted, key);
        encryption.decryptFile(toMultipartFile(encrypted), decrypted, key);

        assertArrayEquals(original, Files.readAllBytes(decrypted));
    }

    @Test
    void encryptPathRoundTripRestoresOriginalBytes() throws Exception {
        byte[] original = "assembled chunk contents".getBytes();
        Path plaintext = tempDir.resolve("plain.bin");
        Path encrypted = tempDir.resolve("encrypted.bin");
        Path decrypted = tempDir.resolve("decrypted.bin");
        Files.write(plaintext, original);

        SecretKey key = encryption.generateKey();
        encryption.encryptFile(plaintext, encrypted, key);
        encryption.decryptFile(toMultipartFile(encrypted), decrypted, key);

        assertArrayEquals(original, Files.readAllBytes(decrypted));
    }

    @Test
    void decryptWithWrongKeyFails() throws Exception {
        Path encrypted = tempDir.resolve("encrypted.bin");
        Path decrypted = tempDir.resolve("decrypted.txt");

        MockMultipartFile source = new MockMultipartFile(
                "file", "plain.txt", "text/plain", "secret".getBytes());

        encryption.encryptFile(source, encrypted, encryption.generateKey());

        assertThrows(StorageOperationException.class,
                () -> encryption.decryptFile(toMultipartFile(encrypted), decrypted, encryption.generateKey()));
    }

    @Test
    void encryptWithMasterKeyRoundTripRestoresOriginalKey() {
        SecretKey originalKey = encryption.generateKey();

        byte[] encryptedKey = encryption.encryptWithMasterKey(originalKey);
        SecretKey decryptedKey = encryption.decryptWithMasterKey(encryptedKey);

        assertArrayEquals(originalKey.getEncoded(), decryptedKey.getEncoded());
    }

    private MockMultipartFile toMultipartFile(Path path) throws Exception {
        return new MockMultipartFile(
                "file",
                path.getFileName().toString(),
                "application/octet-stream",
                Files.readAllBytes(path));
    }
}
