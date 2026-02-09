package com.ldt.user.controller;

import com.ldt.user.dto.request.UserCreateRequest;
import com.ldt.user.dto.wallet.CreateWalletRequest;
import com.ldt.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    @PostMapping
    public ResponseEntity<String> createWallet(@RequestBody UserCreateRequest userCreateRequest){
        userService.createUser(userCreateRequest);
        return ResponseEntity.ok().build();
    }
}
