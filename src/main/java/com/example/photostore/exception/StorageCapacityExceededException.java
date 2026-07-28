package com.example.photostore.exception;

public class StorageCapacityExceededException extends RuntimeException {
    public StorageCapacityExceededException() {
        super("Storage space is too large!");
    }
}
