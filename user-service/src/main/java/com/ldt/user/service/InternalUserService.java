package com.ldt.user.service;

import com.ldt.user.dto.response.UserInternalResponse;
import com.ldt.user.model.User;
import com.ldt.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InternalUserService {
    private final UserRepository userRepository;
    public UserInternalResponse getUserByPhone(String phone_number) {
        User user = userRepository.findByPhone(phone_number).orElseThrow(()-> new RuntimeException("User not found"));
        UserInternalResponse userInternalResponse = new UserInternalResponse(user.getUserId(), user.getStatus());
        return userInternalResponse;
    }
}
