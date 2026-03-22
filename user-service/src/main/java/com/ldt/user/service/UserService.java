package com.ldt.user.service;

import com.ldt.user.context.UserContext;
import com.ldt.user.dto.request.UserCreateRequest;
import com.ldt.user.dto.response.QrTransferResponse;
import com.ldt.user.dto.response.RecipientResponse;
import com.ldt.user.dto.response.UserResponse;
import com.ldt.user.dto.wallet.CreateWalletRequest;
import com.ldt.user.mapper.UserMapper;
import com.ldt.user.model.User;
import com.ldt.user.model.UserRole;
import com.ldt.user.model.UserStatus;
import com.ldt.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
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

    @Value("${qr.secret-key}")
    private String qrSecretKey;

    @Transactional
    public void createUser(UserCreateRequest userCreateRequest) {

        if (userRepository.existsByPhone(userCreateRequest.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được đăng ký");
        }
        if (userRepository.existsByEmail(userCreateRequest.getEmail())) {
            throw new RuntimeException("Email đã được đăng ký");
        }
        try {
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
            // try catch
            restTemplate.postForObject(
                    walletServiceUrl + "/internal/wallets",
                    createWalletRequest,
                    Void.class
            );
        } catch (Exception e) {
            throw new RuntimeException("Đăng ký thất bại: " + e.getMessage());
        }
//        User user = new User();
//        user.setFullName(userCreateRequest.getFullName());
//        user.setPhone(userCreateRequest.getPhone());
//        user.setEmail(userCreateRequest.getEmail());
//        user.setPassword(passwordEncoder.encode(userCreateRequest.getPassword()));
//        user.setTransactionPinHash(passwordEncoder.encode(userCreateRequest.getTransactionPin()));
//        user.setRole(UserRole.USER);
//        user.setStatus(UserStatus.ACTIVE);
//        user = userRepository.save(user);
//        CreateWalletRequest createWalletRequest = new CreateWalletRequest();
//        createWalletRequest.setUserId(user.getUserId());
//
//        restTemplate.postForObject(
//                walletServiceUrl + "/internal/wallets",
//                createWalletRequest,
//                Void.class
//        );
    }

    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        return userMapper.toUserResponse(user);
    }

    public UserResponse getUserCurent() {
        String user_id = UserContext.getUserId();
        User user = userRepository.findById(UUID.fromString(user_id)).orElse(null);
        return userMapper.toUserResponse(user);
    }

    /**
     * Tra cứu thông tin người nhận theo số điện thoại.
     * Throw exception nếu không tìm thấy hoặc tài khoản bị khóa.
     */
    public RecipientResponse getRecipientByPhone(String phone) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với SĐT: " + phone));
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new RuntimeException("Tài khoản người nhận đã bị khóa");
        }
        return new RecipientResponse(user.getFullName(), user.getPhone());
    }

    /**
     * Xác thực mã PIN giao dịch của người dùng hiện tại.
     * - Kiểm tra tài khoản bị khóa (pinLockedUntil)
     * - Sai PIN: tăng pinFailedAttempts, khoá 15 phút nếu >= 5 lần
     * - Đúng PIN: reset pinFailedAttempts
     */
    @Transactional
    public void verifyTransactionPin(String rawPin) {
        String userId = UserContext.getUserId();
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        // Kiểm tra tài khoản có đang bị khóa không
        if (user.getPinLockedUntil() != null && LocalDateTime.now().isBefore(user.getPinLockedUntil())) {
            long minutesLeft = java.time.Duration.between(LocalDateTime.now(), user.getPinLockedUntil()).toMinutes() + 1;
            throw new RuntimeException("Chức năng chuyển tiền tạm khóa. Vui lòng thử lại sau " + minutesLeft + " phút");
        }
        // Xác thực PIN
        if (!passwordEncoder.matches(rawPin, user.getTransactionPinHash())) {
            int attempts = (user.getPinFailedAttempts() == null ? 0 : user.getPinFailedAttempts()) + 1;
            user.setPinFailedAttempts(attempts);
            if (attempts >= 5) {
                user.setPinLockedUntil(LocalDateTime.now().plusMinutes(15));
                userRepository.save(user);
                throw new RuntimeException("Sai PIN quá 5 lần. Chức năng chuyển tiền bị tạm khóa 15 phút");
            }
            userRepository.save(user);
            throw new RuntimeException("Mã PIN không đúng. Còn " + (5 - attempts) + " lần thử");
        }
        user.setPinFailedAttempts(0);
        user.setPinLockedUntil(null);
        userRepository.save(user);
    }

    /**
     * Tạo QR content cho user hiện tại (lấy từ JWT via UserContext).
     * QR content dạng JSON có chữ ký HMAC-SHA256 để chống giả mạo.
     * FE nhận chuỗi này và tự render thành ảnh QR.
     */
    public QrTransferResponse generateMyQr() {
        String userId = UserContext.getUserId();
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        String phone = user.getPhone();
        String name  = user.getFullName();
        String sig = hmacSha512(phone + "|" + name, qrSecretKey);
        String qrContent = String.format(
                "{\"type\":\"SCHOOL_WALLET\",\"phone\":\"%s\",\"name\":\"%s\",\"sig\":\"%s\"}",
                phone, name, sig
        );
        return new QrTransferResponse(qrContent);
    }
    private String hmacSha512(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo chữ ký QR", e);
        }
    }

}
