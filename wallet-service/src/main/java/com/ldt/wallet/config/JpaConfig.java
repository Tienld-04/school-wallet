package com.ldt.wallet.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class JpaConfig {
    // config @EntityListeners(AuditingEntityListener.class) for model
}
