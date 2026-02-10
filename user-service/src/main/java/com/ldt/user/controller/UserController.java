package com.ldt.user.controller;

import com.ldt.user.dto.request.UserCreateRequest;
import com.ldt.user.dto.response.UserResponse;
import com.ldt.user.dto.wallet.CreateWalletRequest;
import com.ldt.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUsersById(@PathVariable UUID userId){
        return ResponseEntity.ok(userService.getUserById(userId));
    }
}
