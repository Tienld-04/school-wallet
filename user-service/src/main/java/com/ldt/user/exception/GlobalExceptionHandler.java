package com.ldt.user.exception;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getFieldError() != null
                ? ex.getFieldError().getDefaultMessage()
                : ErrorCode.INVALID_REQUEST.getMessage();
        ErrorResponse errorResponse = ErrorResponse.builder()
                .code(ErrorCode.INVALID_REQUEST.getCode())
                .message(message)
                .status(HttpStatus.BAD_REQUEST.value())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleApplicationException(AppException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        String message = ex.getCustomMessage() != null ? ex.getCustomMessage() : errorCode.getMessage();
        ErrorResponse errorResponse = ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(message)
                .status(errorCode.getHttpStatusCode().value())
                .build();
        return ResponseEntity.status(errorCode.getHttpStatusCode().value())
                .body(errorResponse);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .code(ErrorCode.UNCATEGORIZEO_EXCEPTION.getCode())
                .message(ex.getMessage())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
