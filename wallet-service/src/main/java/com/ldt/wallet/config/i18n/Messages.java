package com.ldt.wallet.config.i18n;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class Messages {
    public static final Locale VI = Locale.of("vi");

    private final MessageSource messageSource;

    public String get(String key, Object... args) {
        Locale locale = LocaleContextHolder.getLocaleContext() != null ? LocaleContextHolder.getLocale() : VI;
        return messageSource.getMessage(key, args, key, locale);
    }

    public String getVi(String key, Object... args) {
        return messageSource.getMessage(key, args, key, VI);
    }
}
