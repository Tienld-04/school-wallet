package com.ldt.gateway.exception;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ErrorResponse {
    private int code;
    private String message;
    private int status;

}
