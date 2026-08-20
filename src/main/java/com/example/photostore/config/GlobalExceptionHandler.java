package com.example.photostore.config;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import com.example.photostore.exception.EmailAlreadyExistsException;
import com.example.photostore.exception.ErrorResponse;
import com.example.photostore.exception.InvalidFileException;
import com.example.photostore.exception.InvalidPasswordException;
import com.example.photostore.exception.MediaFileNotFoundException;
import com.example.photostore.exception.RoleNotFoundException;
import com.example.photostore.exception.StorageCapacityExceededException;
import com.example.photostore.exception.StorageOperationException;
import com.example.photostore.exception.UserNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(MediaFileNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleMediaFileNotFound(MediaFileNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, "MEDIA_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(RoleNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleRoleNotFound(RoleNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, "ROLE_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(EmailAlreadyExistsException exception) {
        return error(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", exception.getMessage());
    }

    @ExceptionHandler(InvalidPasswordException.class)
    public ResponseEntity<ErrorResponse> handleInvalidPassword(InvalidPasswordException exception) {
        return error(HttpStatus.UNAUTHORIZED, "INVALID_PASSWORD", exception.getMessage());
    }

    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<ErrorResponse> handleInvalidFile(InvalidFileException exception) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_FILE", exception.getMessage());
    }

    @ExceptionHandler(StorageCapacityExceededException.class)
    public ResponseEntity<ErrorResponse> handleStorageCapacity(StorageCapacityExceededException exception) {
        return error(HttpStatus.BAD_REQUEST, "STORAGE_CAPACITY_EXCEEDED", exception.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException exception) {
        return error(HttpStatus.BAD_REQUEST, "FILE_TOO_LARGE", "Uploaded file is too large.");
    }

    @ExceptionHandler(StorageOperationException.class)
    public ResponseEntity<ErrorResponse> handleStorageOperation(StorageOperationException exception) {
        log.error("Storage operation failed", exception);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "STORAGE_OPERATION_FAILED",
                "The file could not be stored.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return error(HttpStatus.BAD_REQUEST, "BAD_REQUEST", exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception) {
        log.error("Unhandled application exception", exception);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred.");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException exception) {
        return error(
                HttpStatus.UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "Invalid email or password");
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoHandlerFound(NoHandlerFoundException exception) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", "Route not found.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException exception) {
        return error(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED",
                "HTTP method not allowed for this route.");
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String code, String message) {
        ErrorResponse response = new ErrorResponse(code, message, status.value(), Instant.now());
        return ResponseEntity.status(status).body(response);
    }
}
