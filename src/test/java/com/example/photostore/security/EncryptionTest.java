package com.example.photostore.security;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Files;
import java.nio.file.Path;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.example.photostore.exception.StorageOperationException;

class EncryptionTest {

    private static final String TEST_MASTER_KEY = "HxWH6PWfcXhz1eueOBDIscOvxT1WdUIGA4EX5PucT8A=";

    private final Encryption encryption = new Encryption(TEST_MASTER_KEY);

    @TempDir
    Path tempDir;

    @Test
    void encryptAndDecryptRoundTripRestoresOriginalBytes() throws Exception {
        byte[] original = "any file content".getBytes();
        Path plaintext = tempDir.resolve("plain.txt");
        Path encrypted = tempDir.resolve("encrypted.bin");
        Files.write(plaintext, original);

        SecretKey key = encryption.generateKey();
        encryption.encryptFile(plaintext, encrypted, key);

        assertArrayEquals(original, encryption.decryptFile(encrypted, key));
    }

    @Test
    void encryptPathRoundTripRestoresOriginalBytes() throws Exception {
        byte[] original = "assembled chunk contents".getBytes();
        Path plaintext = tempDir.resolve("plain.bin");
        Path encrypted = tempDir.resolve("encrypted.bin");
        Files.write(plaintext, original);

        SecretKey key = encryption.generateKey();
        encryption.encryptFile(plaintext, encrypted, key);

        assertArrayEquals(original, encryption.decryptFile(encrypted, key));
    }

    @Test
    void decryptWithWrongKeyFails() throws Exception {
        Path plaintext = tempDir.resolve("plain.txt");
        Path encrypted = tempDir.resolve("encrypted.bin");
        Files.write(plaintext, "secret".getBytes());

        encryption.encryptFile(plaintext, encrypted, encryption.generateKey());

        assertThrows(StorageOperationException.class,
                () -> encryption.decryptFile(encrypted, encryption.generateKey()));
    }

    @Test
    void encryptWithMasterKeyRoundTripRestoresOriginalKey() {
        SecretKey originalKey = encryption.generateKey();

        byte[] encryptedKey = encryption.encryptWithMasterKey(originalKey);
        SecretKey decryptedKey = encryption.decryptWithMasterKey(encryptedKey);

        assertArrayEquals(originalKey.getEncoded(), decryptedKey.getEncoded());
    }
}
