package com.ldt.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecipientResponse {
    private String fullName;
    private String phone;
//    private String status;
}
