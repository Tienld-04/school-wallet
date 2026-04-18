package com.ldt.notification;

import com.ldt.notification.config.EnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NotificationServiceApplication {

    public static void main(String[] args) {
        EnvLoader.load();
        SpringApplication.run(NotificationServiceApplication.class, args);
    }

}
