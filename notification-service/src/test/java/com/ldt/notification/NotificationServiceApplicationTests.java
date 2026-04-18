package com.ldt.notification;

import com.ldt.notification.config.EnvLoader;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class NotificationServiceApplicationTests {
    static {
        EnvLoader.load();
    }
    @Test
    void contextLoads() {
    }

}
