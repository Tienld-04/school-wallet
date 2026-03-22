package com.ldt.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    @Value("${internal.secret}")
    private String internalSecret;
    @Value("${service.url.user-service}")
    private String userServiceUrl;
    private final WebClient webClient;

    public AuthGlobalFilter(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMap(auth -> {
                    Jwt jwt = (Jwt) auth.getPrincipal();
                    String jti = jwt.getId();
                    String userId = jwt.getSubject();
                    String role = jwt.getClaimAsString("role");
                    String phone = jwt.getClaimAsString("phone");
                    // Gọi user-service check blacklist
                    return webClient.get()
                            .uri(userServiceUrl + "/internal/users/validate?jti=" + jti)
                            .header("X-Internal-Secret", internalSecret)
                            .retrieve()
                            .toBodilessEntity()
                            .flatMap(response -> {
                                // Token ok → add header + forward
                                ServerHttpRequest modified = exchange.getRequest().mutate()
                                        .header("X-Internal-Secret", internalSecret)
                                        .header("X-User-Id", userId)
                                        .header("X-User-Role", role)
                                        .header("X-User-Phone", phone)
                                        .build();
                                return chain.filter(exchange.mutate().request(modified).build());
                            })
                            .onErrorResume(e -> {
                                if (e instanceof WebClientResponseException) {
                                    // User-service return 401
                                    WebClientResponseException ex = (WebClientResponseException) e;
                                    exchange.getResponse().setStatusCode(ex.getStatusCode());
                                    return exchange.getResponse().setComplete();
                                }
                                // user-service down
                                Map<String, Object> body = Map.of(
                                        "status", 503,
                                        "error", "Service Unavailable",
                                        "message", "Service tạm thời không khả dụng"
                                );
                                exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
                                exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
                                try {
                                    ObjectMapper mapper = new ObjectMapper();
                                    byte[] bytes = mapper.writeValueAsBytes(body);
                                    return exchange.getResponse().writeWith(
                                            Mono.just(exchange.getResponse().bufferFactory().wrap(bytes))
                                    );
                                } catch (JsonProcessingException ex) {
                                    return exchange.getResponse().setComplete();
                                }
                            });
                })
                .switchIfEmpty(chain.filter(exchange));
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
