package com.ldt.user;

import com.ldt.user.config.EnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@SpringBootApplication
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class UserServiceApplication {

    public static void main(String[] args) {
        EnvLoader.load();
        SpringApplication.run(UserServiceApplication.class, args);
    }

}
