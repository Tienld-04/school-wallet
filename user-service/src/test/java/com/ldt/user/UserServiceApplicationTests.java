package com.ldt.user;

import com.ldt.user.config.EnvLoader;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class UserServiceApplicationTests {

    static {
        EnvLoader.load();
    }
    @Test
    void contextLoads() {
    }

}
