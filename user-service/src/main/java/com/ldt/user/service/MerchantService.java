package com.ldt.user.service;

import com.ldt.user.dto.merchant.MerchantListResponse;
import com.ldt.user.dto.merchant.MerchantRequest;
import com.ldt.user.dto.merchant.MerchantResponse;
import com.ldt.user.exception.AppException;
import com.ldt.user.exception.ErrorCode;
import com.ldt.user.model.Merchant;
import com.ldt.user.model.MerchantType;
import com.ldt.user.model.User;
import com.ldt.user.repository.MerchantRepository;
import com.ldt.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MerchantService {
    private final MerchantRepository merchantRepository;
    private final UserRepository userRepository;

    @Transactional
    public MerchantResponse createMerchant(MerchantRequest request) {
        if (merchantRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.MERCHANT_NAME_ALREADY_EXISTS);
        }
        MerchantType type = parseMerchantType(request.getType());
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Merchant merchant = Merchant.builder()
                .name(request.getName())
                .type(type)
                .user(user)
                .active(true)
                .build();
        merchantRepository.save(merchant);
        return toResponse(merchant);
    }

    @Transactional
    public MerchantResponse updateMerchant(UUID merchantId, MerchantRequest request) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NOT_FOUND));

        if (merchantRepository.existsByNameAndMerchantIdNot(request.getName(), merchantId)) {
            throw new AppException(ErrorCode.MERCHANT_NAME_ALREADY_EXISTS);
        }
        MerchantType type = parseMerchantType(request.getType());
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        merchant.setName(request.getName());
        merchant.setType(type);
        merchant.setUser(user);
        merchantRepository.save(merchant);
        return toResponse(merchant);
    }

    @Transactional
    public void deleteMerchant(UUID merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NOT_FOUND));
        merchant.setActive(false);
        merchantRepository.save(merchant);
    }

    @Transactional(readOnly = true)
    public MerchantResponse getMerchant(UUID merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NOT_FOUND));
        return toResponse(merchant);
    }

    @Transactional(readOnly = true)
    public Page<MerchantResponse> getMerchants(int page, int size, String type, String search) {
        Specification<Merchant> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("active")));

            if (type != null && !type.isBlank()) {
                try {
                    MerchantType merchantType = MerchantType.valueOf(type.toUpperCase());
                    predicates.add(cb.equal(root.get("type"), merchantType));
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), pattern));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return merchantRepository.findAll(spec, pageRequest).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<MerchantResponse> getMerchantsByUserId(UUID userId) {
        return merchantRepository.findByUser_UserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MerchantListResponse> getActiveMerchants(String type) {
        List<Merchant> merchants;
        if (type != null && !type.isBlank()) {
            MerchantType merchantType = parseMerchantType(type);
            merchants = merchantRepository.findByActiveTrueAndType(merchantType);
        } else {
            merchants = merchantRepository.findByActiveTrue();
        }
        return merchants.stream()
                .map(m -> MerchantListResponse.builder()
                        .merchantId(m.getMerchantId())
                        .name(m.getName())
                        .type(m.getType().name())
                        .userId(m.getUser().getUserId())
                        .userPhone(m.getUser().getPhone())
                        .build())
                .toList();
    }

    private MerchantType parseMerchantType(String type) {
        try {
            return MerchantType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_MERCHANT_TYPE);
        }
    }

    private MerchantResponse toResponse(Merchant merchant) {
        return MerchantResponse.builder()
                .merchantId(merchant.getMerchantId())
                .name(merchant.getName())
                .type(merchant.getType().name())
                .active(merchant.getActive())
                .userId(merchant.getUser().getUserId())
                .createdAt(merchant.getCreatedAt())
                .build();
    }
}
