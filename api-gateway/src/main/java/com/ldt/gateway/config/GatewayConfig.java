package com.ldt.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {
    @Value("${service.url.user-service}")
    private String userServiceUrl;

    @Value("${service.url.transaction-service}")
    private String transactionServiceUrl;

    @Value("${service.url.wallet-service}")
    private String walletServiceUrl;

    @Value("${service.url.notification-service}")
    private String notificationServiceUrl;

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Route cho User Service
                .route("user-service", r -> r
                        .path("/api/v1/users/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/users/(?<segment>.*)", "/api/users/${segment}")
                        )
                        .uri(userServiceUrl))
                .route("transaction-service-root", r -> r
                        .path("/api/v1/transactions")
                        .filters(f -> f
                                .rewritePath("/api/v1/transactions", "/api/transactions")
                        )
                        .uri(transactionServiceUrl))
                .route("transaction-service", r -> r
                        .path("/api/v1/transactions/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/transactions/(?<segment>.*)", "/api/transactions/${segment}")
                        )
                        .uri(transactionServiceUrl))
                .route("wallet-service", r -> r
                        .path("/api/v1/wallets/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/wallets/(?<segment>.*)", "/api/wallets/${segment}")
                        )
                        .uri(walletServiceUrl))
                // Route cho Notification Service (OTP)
                .route("notification-service", r -> r
                        .path("/api/v1/otp/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/otp/(?<segment>.*)", "/api/otp/${segment}")
                        )
                        .uri(notificationServiceUrl))
                .build();
    }
}
