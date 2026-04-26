package com.ldt.transaction;

import com.ldt.transaction.config.EnvLoader;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TransactionServiceApplicationTests {
    static {
        EnvLoader.load();
    }
    @Test
    void contextLoads() {
    }

}
