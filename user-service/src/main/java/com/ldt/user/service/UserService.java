package com.ldt.user.service;

import com.ldt.user.dto.request.UserCreateRequest;
import com.ldt.user.dto.response.UserResponse;
import com.ldt.user.dto.wallet.CreateWalletRequest;
import com.ldt.user.mapper.UserMapper;
import com.ldt.user.model.User;
import com.ldt.user.model.UserRole;
import com.ldt.user.model.UserStatus;
import com.ldt.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;


@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${service.wallet-service.url}")
    private String walletServiceUrl;

    public void createUser(UserCreateRequest userCreateRequest) {

        if (userRepository.existsByPhone(userCreateRequest.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được đăng ký");
        }
        if (userRepository.existsByEmail(userCreateRequest.getEmail())) {
            throw new RuntimeException("Email đã được đăng ký");
        }

        User user = new User();
        user.setFullName(userCreateRequest.getFullName());
        user.setPhone(userCreateRequest.getPhone());
        user.setEmail(userCreateRequest.getEmail());
        user.setPassword(passwordEncoder.encode(userCreateRequest.getPassword()));
        user.setTransactionPinHash(passwordEncoder.encode(userCreateRequest.getTransactionPin()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);
        CreateWalletRequest createWalletRequest = new CreateWalletRequest();
        createWalletRequest.setUserId(user.getUserId());
        restTemplate.postForObject(
                walletServiceUrl + "/internal/wallets",
                createWalletRequest,
                Void.class
        );
    }

    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        return userMapper.toUserResponse(user);
    }

}
