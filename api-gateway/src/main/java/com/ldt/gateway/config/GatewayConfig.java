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

//    @Value("${service.url.wallet-service}")
//    private String walletServiceUrl;
//
//    @Value("${service.url.transaction-service}")
//    private String transactionServiceUrl;

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Route cho User Service
                .route("user-service", r -> r
                        .path("/api/v1/users/**")
                        .filters(f -> f
                                .rewritePath("/api/v1/users/(?<segment>.*)", "/api/users/${segment}")
//                                .tokenRelay()
                        )
                        .uri(userServiceUrl))
                .build();
    }
}
