package com.ldt.user.service;

import com.ldt.user.model.User;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    @Value("${jwt.secret-key}")
    private String secretKey;

    private SecretKey getSigningKey() {
        return new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512"
        );
    }

    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getUserId().toString())
                .claim("role", user.getRole().name())
                .claim("phone", user.getPhone())
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3 * 60 * 60 * 1000))
                .signWith(getSigningKey())
                .compact();
    }
}
