package com.ldt.gateway.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Vì Gateway dùng WebFlux và chạy ở tầng Filter, Do đó cần implement ErrorWebExceptionHandler.
 * Đặt thứ tự ưu tiên cao hơn lớp xử lý lỗi mặc định của Spring @Order(-2)
 */
@Configuration
@Order(-2)
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper;

    public GlobalExceptionHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ErrorResponse errorResponse;

        if (ex instanceof AppException appEx) {
            ErrorCode errorCode = appEx.getErrorCode();
            errorResponse = ErrorResponse.builder()
                    .code(errorCode.getCode())
                    .message(errorCode.getMessage())
                    .status(errorCode.getHttpStatusCode().value())
                    .build();
            exchange.getResponse().setStatusCode(errorCode.getHttpStatusCode());
        } else {
            errorResponse = ErrorResponse.builder()
                    .code(ErrorCode.UNCATEGORIZEO_EXCEPTION.getCode())
                    .message(ex.getMessage() != null ? ex.getMessage() : ErrorCode.UNCATEGORIZEO_EXCEPTION.getMessage())
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .build();
            exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        return exchange.getResponse().writeWith(Mono.fromSupplier(() -> {
            try {
                byte[] bytes = objectMapper.writeValueAsBytes(errorResponse);
                return exchange.getResponse().bufferFactory().wrap(bytes);
            } catch (Exception e) {
                return exchange.getResponse().bufferFactory().wrap(new byte[0]);
            }
        }));
    }
}
