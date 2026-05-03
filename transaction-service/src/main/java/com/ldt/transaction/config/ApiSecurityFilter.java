package com.ldt.transaction.config;

import com.ldt.transaction.context.UserContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiSecurityFilter extends OncePerRequestFilter {

    @Value("${internal.secret}")
    private String internalSecret;

    // api/transactions/topup/ipn -> endpoint public để VNPay callback.
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path != null && path.startsWith("/api/transactions/topup/ipn");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        String secret = request.getHeader("X-Internal-Secret");
        if (!internalSecret.equals(secret)) {
            response.setStatus(401);
            response.getWriter().write("Unauthorized");
            return;
        }
        String userId = request.getHeader("X-User-Id");
        String userPhone = request.getHeader("X-User-Phone");
        String role = request.getHeader("X-User-Role");

        if (userId != null) {
            UserContext.setUserId(userId);
            UserContext.setUserPhone(userPhone);
            UserContext.setRole(role);
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
        }
    }
}
