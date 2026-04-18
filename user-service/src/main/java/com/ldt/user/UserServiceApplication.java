package com.ldt.user;

import com.ldt.user.config.EnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UserServiceApplication {

    public static void main(String[] args) {
        EnvLoader.load();
        SpringApplication.run(UserServiceApplication.class, args);
    }

}
