package com.ldt.eureka.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;


@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class EurekaAuthFilter extends OncePerRequestFilter {

    @Value("${eureka.auth.username}")
    private String username;

    @Value("${eureka.auth.password}")
    private String password;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/eureka");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        if (isAuthorized(request.getHeader("Authorization"))) {
            filterChain.doFilter(request, response);
            return;
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setHeader("WWW-Authenticate", "Basic realm=\"eureka\"");
        response.getWriter().write("Unauthorized");
    }

    private boolean isAuthorized(String header) {
        if (header == null || !header.startsWith("Basic ")) {
            return false;
        }
        try {
            String decoded = new String(
                    Base64.getDecoder().decode(header.substring(6).trim()), StandardCharsets.UTF_8);
            int sep = decoded.indexOf(':');
            return sep > 0
                    && username.equals(decoded.substring(0, sep))
                    && password.equals(decoded.substring(sep + 1));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
