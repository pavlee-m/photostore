package com.example.photostore.security;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.CipherOutputStream;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.example.photostore.exception.StorageOperationException;

@Component
public class Encryption {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int KEY_SIZE_BITS = 256;
    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;

    private final SecretKey masterKey;

    public Encryption(@Value("${photostore.master_key}") String masterKeyBase64) {
        byte[] keyBytes = Base64.getDecoder().decode(masterKeyBase64);
        if (keyBytes.length != KEY_SIZE_BITS / 8) {
            throw new IllegalStateException("Master key must be 256 bits");
        }
        this.masterKey = new SecretKeySpec(keyBytes, "AES");
    }

    public SecretKey generateKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
            keyGenerator.init(KEY_SIZE_BITS, SecureRandom.getInstanceStrong());
            return keyGenerator.generateKey();
        } catch (GeneralSecurityException e) {
            throw new StorageOperationException("Failed to generate encryption key", e);
        }
    }

    // Used for encryption of keys with the master key
    public byte[] encryptWithMasterKey(SecretKey key) {
        return encryptBytes(key.getEncoded(), masterKey);
    }

    public SecretKey decryptWithMasterKey(byte[] encryptedKey) {
        byte[] keyBytes = decryptBytes(encryptedKey, masterKey);
        return new SecretKeySpec(keyBytes, "AES");
    }

    public void encryptFile(Path source, Path destination, SecretKey key) {
        try (InputStream fileIn = Files.newInputStream(source)) {
            encryptStream(fileIn, destination, key);
        } catch (IOException e) {
            throw new StorageOperationException("Failed to encrypt file", e);
        }
    }

    public byte[] decryptFile(Path source, SecretKey key) {
        try {
            return decryptBytes(Files.readAllBytes(source), key);
        } catch (IOException e) {
            throw new StorageOperationException("Failed to decrypt file", e);
        }
    }

    private void encryptStream(InputStream source, Path destination, SecretKey key) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            SecureRandom.getInstanceStrong().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));

            try (OutputStream fileOut = Files.newOutputStream(destination);
                    CipherOutputStream cipherOut = new CipherOutputStream(fileOut, cipher)) {
                fileOut.write(iv);
                source.transferTo(cipherOut);
            }
        } catch (IOException | GeneralSecurityException e) {
            throw new StorageOperationException("Failed to encrypt file", e);
        }
    }

    private byte[] encryptBytes(byte[] plaintext, SecretKey key) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            SecureRandom.getInstanceStrong().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext);

            byte[] encrypted = new byte[GCM_IV_LENGTH_BYTES + ciphertext.length];
            System.arraycopy(iv, 0, encrypted, 0, GCM_IV_LENGTH_BYTES);
            System.arraycopy(ciphertext, 0, encrypted, GCM_IV_LENGTH_BYTES, ciphertext.length);
            return encrypted;
        } catch (GeneralSecurityException e) {
            throw new StorageOperationException("Failed to encrypt data", e);
        }
    }

    private byte[] decryptBytes(byte[] encrypted, SecretKey key) {
        try {
            if (encrypted.length <= GCM_IV_LENGTH_BYTES) {
                throw new StorageOperationException("Failed to decrypt data: missing or truncated IV", null);
            }

            byte[] iv = Arrays.copyOfRange(encrypted, 0, GCM_IV_LENGTH_BYTES);
            byte[] ciphertext = Arrays.copyOfRange(encrypted, GCM_IV_LENGTH_BYTES, encrypted.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            return cipher.doFinal(ciphertext);
        } catch (GeneralSecurityException e) {
            throw new StorageOperationException("Failed to decrypt data", e);
        }
    }
}
