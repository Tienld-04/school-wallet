package com.ldt.eureka;

import com.ldt.eureka.config.EnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {

    public static void main(String[] args) {
        EnvLoader.load();
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
