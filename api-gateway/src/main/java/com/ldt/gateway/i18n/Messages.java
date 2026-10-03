package com.ldt.gateway.i18n;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class Messages {
    private static final Locale VI = Locale.of("vi");

    private final MessageSource messageSource;

    public String get(String key, Locale locale) {
        return messageSource.getMessage(key, null, key, locale != null ? locale : VI);
    }
}
