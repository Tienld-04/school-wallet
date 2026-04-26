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
                // Route cho Auth
                .route("auth-service", r -> r
                        .path("/api/v1/auth/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/auth/(?<segment>.*)", "/api/auth/${segment}")
                        )
                        .uri(userServiceUrl))
                // Route cho Admin
                .route("admin-service", r -> r
                        .path("/api/v1/admin/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/admin/(?<segment>.*)", "/api/admin/${segment}")
                        )
                        .uri(userServiceUrl))
                // Route cho User Service
                .route("user-service", r -> r
                        .path("/api/v1/users/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/users/(?<segment>.*)", "/api/users/${segment}")
                        )
                        .uri(userServiceUrl))
                // Route cho Merchant
                .route("merchant-service", r -> r
                        .path("/api/v1/merchants/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/merchants/(?<segment>.*)", "/api/merchants/${segment}")
                        )
                        .uri(userServiceUrl))
                .route("merchant-service-root", r -> r
                        .path("/api/v1/merchants")
                        .filters(f -> f
                                .rewritePath("/api/v1/merchants", "/api/merchants")
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
                .route("notification-otp", r -> r
                        .path("/api/v1/otp/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/otp/(?<segment>.*)", "/api/otp/${segment}")
                        )
                        .uri(notificationServiceUrl))
                // Route cho Notification inbox
                .route("notification-service", r -> r
                        .path("/api/v1/notifications/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/notifications/(?<segment>.*)", "/api/notifications/${segment}")
                        )
                        .uri(notificationServiceUrl))
                // WebSocket route cho notification real-time
                .route("notification-ws", r -> r
                        .path("/ws/**")
                        .uri(notificationServiceUrl))
                .build();
    }
}
