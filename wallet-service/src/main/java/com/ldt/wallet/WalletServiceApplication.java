package com.ldt.wallet;

import com.ldt.wallet.config.EnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WalletServiceApplication {

    public static void main(String[] args) {
        EnvLoader.load();
        SpringApplication.run(WalletServiceApplication.class, args);
    }

}
