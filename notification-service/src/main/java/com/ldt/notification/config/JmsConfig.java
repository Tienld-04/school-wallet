package com.ldt.notification.config;

import jakarta.jms.ConnectionFactory;
import lombok.extern.slf4j.Slf4j;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;
import org.springframework.jms.connection.SingleConnectionFactory;

@Configuration
@EnableJms
@Slf4j
public class JmsConfig {

    @Bean
    public SingleConnectionFactory connectionFactory(
            @Value("${spring.activemq.broker-url}") String brokerUrl,
            @Value("${spring.activemq.user}") String user,
            @Value("${spring.activemq.password}") String password
    ) {
        ActiveMQConnectionFactory activeMQFactory = new ActiveMQConnectionFactory();
        activeMQFactory.setBrokerURL(brokerUrl);
        activeMQFactory.setUserName(user);
        activeMQFactory.setPassword(password);

        SingleConnectionFactory factory = new SingleConnectionFactory(activeMQFactory);
        factory.setClientId("notification-service");
        factory.setReconnectOnException(true);
        return factory;
    }

    @Bean
    public DefaultJmsListenerContainerFactory jmsListenerContainerFactory(SingleConnectionFactory connectionFactory) {
        DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setPubSubDomain(true);
        factory.setSubscriptionDurable(true);
        factory.setErrorHandler(t -> log.error("JMS listener error: {}", t.getMessage(), t));
        return factory;
    }
}
