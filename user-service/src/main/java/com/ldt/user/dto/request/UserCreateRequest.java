package com.ldt.user.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserCreateRequest {
    private String fullName;
    private String phone;
    private String email;
    private String password;
    private String transactionPin;

}
