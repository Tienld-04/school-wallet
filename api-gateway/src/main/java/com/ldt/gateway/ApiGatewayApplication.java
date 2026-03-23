package com.ldt.gateway;

import com.ldt.gateway.utils.EnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        EnvLoader.load();
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

}
