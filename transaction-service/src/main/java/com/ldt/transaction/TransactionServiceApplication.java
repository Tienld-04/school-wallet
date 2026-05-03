package com.ldt.transaction;

import com.ldt.transaction.config.EnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
// import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
// @EnableScheduling
public class TransactionServiceApplication {

    public static void main(String[] args) {
        EnvLoader.load();
        SpringApplication.run(TransactionServiceApplication.class, args);
    }

}
