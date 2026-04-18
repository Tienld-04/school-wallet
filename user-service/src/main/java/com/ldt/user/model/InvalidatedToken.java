package com.ldt.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "invalidated_tokens")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvalidatedToken {

    @Id
    @Column(name = "jti", nullable = false)
    private String jti;

    @Column(name = "expiry_time", nullable = false)
    private LocalDateTime expiryTime;
}
