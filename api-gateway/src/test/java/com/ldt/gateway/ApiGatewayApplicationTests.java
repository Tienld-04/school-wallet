package com.ldt.gateway;

import com.ldt.gateway.utils.EnvLoader;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApiGatewayApplicationTests {
    static {
        EnvLoader.load();
    }
    @Test
    void contextLoads() {
    }

}
