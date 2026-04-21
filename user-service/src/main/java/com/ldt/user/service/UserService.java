package com.ldt.user.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ldt.user.context.UserContext;
import com.ldt.user.dto.request.QrVerifyRequest;
import com.ldt.user.dto.request.UserCreateRequest;
import com.ldt.user.dto.response.QrTransferResponse;
import com.ldt.user.dto.response.QrVerifyResponse;
import com.ldt.user.dto.response.RecipientResponse;
import com.ldt.user.dto.response.UserResponse;
import com.ldt.user.dto.wallet.CreateWalletRequest;
import com.ldt.user.exception.AppException;
import com.ldt.user.exception.ErrorCode;
import com.ldt.user.mapper.UserMapper;
import com.ldt.user.model.User;
import com.ldt.user.model.UserRole;
import com.ldt.user.model.UserStatus;
import com.ldt.user.repository.UserRepository;
import com.ldt.user.service.verify.VerifyOTPTokenService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final VerifyOTPTokenService verifyOTPTokenService;

    @Value("${service.wallet-service.url}")
    private String walletServiceUrl;

    @Value("${qr.secret-key}")
    private String qrSecretKey;

    @Transactional
    public void createUser(UserCreateRequest userCreateRequest) {
        // 1. Verify token xác thực SĐT
        verifyOTPTokenService.verifyOTPToken(
                userCreateRequest.getVerificationToken(),
                userCreateRequest.getPhone()
        );
        // 2. Check phone and email
        if (userRepository.existsByPhone(userCreateRequest.getPhone())) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS);
        }
        if (userRepository.existsByEmail(userCreateRequest.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        try {
            // 3. Tạo user
            User user = new User();
            user.setFullName(userCreateRequest.getFullName());
            user.setPhone(userCreateRequest.getPhone());
            user.setEmail(userCreateRequest.getEmail());
            user.setPassword(passwordEncoder.encode(userCreateRequest.getPassword()));
            user.setTransactionPinHash(passwordEncoder.encode(userCreateRequest.getTransactionPin()));
            user.setRole(UserRole.USER);
            user.setStatus(UserStatus.ACTIVE);
            user = userRepository.save(user);

            // 4. Tạo ví
            CreateWalletRequest createWalletRequest = new CreateWalletRequest();
            createWalletRequest.setUserId(user.getUserId());
            restTemplate.postForObject(
                    walletServiceUrl + "/internal/wallets",
                    createWalletRequest,
                    Void.class
            );
        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Registration failed for phone {}: {}", userCreateRequest.getPhone(), e.getMessage());
            throw new AppException(ErrorCode.REGISTRATION_FAILED, "Đăng ký thất bại. Vui lòng thử lại sau");
        }
    }

    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }

    public UserResponse getUserCurent() {
        String user_id = UserContext.getUserId();
        User user = userRepository.findById(UUID.fromString(user_id))
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }

    /**
     * Tra cứu thông tin người nhận theo số điện thoại.
     * Throw exception nếu không tìm thấy hoặc tài khoản bị khóa.
     */
    public RecipientResponse getRecipientByPhone(String phone) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException(ErrorCode.RECIPIENT_LOCKED);
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
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        // Kiểm tra tài khoản có đang bị khóa không
        if (user.getPinLockedUntil() != null && LocalDateTime.now().isBefore(user.getPinLockedUntil())) {
            long minutesLeft = java.time.Duration.between(LocalDateTime.now(), user.getPinLockedUntil()).toMinutes() + 1;
            throw new AppException(ErrorCode.PIN_LOCKED, "Chức năng chuyển tiền tạm khóa. Vui lòng thử lại sau " + minutesLeft + " phút");
        }
        // Xác thực PIN
        if (!passwordEncoder.matches(rawPin, user.getTransactionPinHash())) {
            int attempts = (user.getPinFailedAttempts() == null ? 0 : user.getPinFailedAttempts()) + 1;
            user.setPinFailedAttempts(attempts);
            if (attempts >= 5) {
                user.setPinLockedUntil(LocalDateTime.now().plusMinutes(15));
                userRepository.save(user);
                throw new AppException(ErrorCode.PIN_LOCKED, "Sai PIN quá 5 lần. Chức năng chuyển tiền bị tạm khóa 15 phút");
            }
            userRepository.save(user);
            throw new AppException(ErrorCode.INVALID_PIN, "Mã PIN không đúng. Còn " + (5 - attempts) + " lần thử");
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
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        String phone = user.getPhone();
        String name = user.getFullName();
        String sig = hmacSha512(phone + "|" + name, qrSecretKey);
        try {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("type", "SCHOOL_WALLET_STATIC");
            node.put("phone", phone);
            node.put("name", name);
            node.put("sig", sig);
            return new QrTransferResponse(objectMapper.writeValueAsString(node));
        } catch (Exception e) {
            throw new AppException(ErrorCode.QR_SIGN_ERROR);
        }
    }

    private String hmacSha512(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(rawHmac);
        } catch (Exception e) {
            throw new AppException(ErrorCode.QR_SIGN_ERROR);
        }
    }

    /**
     * Tạo Dynamic QR: người nhận set sẵn amount + description.
     * Người gửi quét QR → thấy luôn thông tin người nhận + số tiền → chỉ cần nhập PIN.
     * type = "SCHOOL_WALLET_DYNAMIC" để FE phân biệt với Static QR.
     */
    public QrTransferResponse generateDynamicQr(BigDecimal amount, String description) {
        String userId = UserContext.getUserId();
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        String phone = user.getPhone();
        String name = user.getFullName();
        String desc = (description != null) ? description : "";
        String amountStr = amount.toPlainString();
        long expiredAt = System.currentTimeMillis() + 5 * 60 * 1000;
        String data = phone + "|" + name + "|" + amountStr + "|" + desc + "|" + expiredAt;
        String sig = hmacSha512(data, qrSecretKey);
        try {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("type", "SCHOOL_WALLET_DYNAMIC");
            node.put("phone", phone);
            node.put("name", name);
            node.put("amount", amountStr);
            node.put("description", desc);
            node.put("expiredAt", expiredAt);
            node.put("sig", sig);
            return new QrTransferResponse(objectMapper.writeValueAsString(node));
        } catch (Exception e) {
            throw new AppException(ErrorCode.QR_SIGN_ERROR);
        }
    }

    /**
     * Xác minh tính hợp lệ của QR code quét được.
     */
    public QrVerifyResponse verifyQr(QrVerifyRequest request) {
        try {
            JsonNode node = objectMapper.readTree(request.getQrContent());
            String type = node.path("type").asText();
            if (!"SCHOOL_WALLET_STATIC".equals(type) && !"SCHOOL_WALLET_DYNAMIC".equals(type)) {
                throw new AppException(ErrorCode.QR_INVALID_SYSTEM);
            }
            String phone = node.path("phone").asText();
            String name = node.path("name").asText();
            String sig = node.path("sig").asText();
            String expectedSig;
            // for dynamic qr
            if ("SCHOOL_WALLET_DYNAMIC".equals(type)) {
                String amountStr = node.path("amount").asText();
                String desc = node.path("description").asText();
                long expiredAt = node.path("expiredAt").asLong();

                if (System.currentTimeMillis() > expiredAt) {
                    throw new AppException(ErrorCode.QR_EXPIRED);
                }
                String data = phone + "|" + name + "|" + amountStr + "|" + desc + "|" + expiredAt;
                expectedSig = hmacSha512(data, qrSecretKey);
                if (!expectedSig.equals(sig)) {
                    throw new AppException(ErrorCode.QR_INVALID);
                }
                return QrVerifyResponse.builder()
                        .phone(phone)
                        .name(name)
                        .amount(new BigDecimal(amountStr))
                        .description(desc)
                        .build();
            } else {
                // for static qr
                String data = phone + "|" + name;
                expectedSig = hmacSha512(data, qrSecretKey);
                if (!expectedSig.equals(sig)) {
                    throw new AppException(ErrorCode.QR_INVALID);
                }
                return QrVerifyResponse.builder()
                        .phone(phone)
                        .name(name)
                        .build();
            }
        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            throw new AppException(ErrorCode.QR_FORMAT_ERROR);
        }
    }

}
