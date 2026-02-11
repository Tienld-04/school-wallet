package com.ldt.user.controller;

import com.ldt.user.dto.response.UserInternalResponse;
import com.ldt.user.service.InternalUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {
    private final InternalUserService  internalUserService;
    @GetMapping("/{phone_number}")
    public ResponseEntity<UserInternalResponse> getUserByPhone(@PathVariable String phone_number) {
            return ResponseEntity.ok(internalUserService.getUserByPhone(phone_number));
    }

}
