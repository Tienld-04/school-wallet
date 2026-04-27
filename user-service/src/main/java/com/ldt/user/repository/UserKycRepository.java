package com.ldt.user.repository;

import com.ldt.user.model.KycStatus;
import com.ldt.user.model.UserKyc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserKycRepository extends JpaRepository<UserKyc, UUID> {
    Optional<UserKyc> findByUserId(UUID userId);

    boolean existsByStudentCodeAndUserIdNot(String studentCode, UUID userId);
    boolean existsByIdNumberAndUserIdNot(String idNumber, UUID userId);

    Page<UserKyc> findAllByStatus(KycStatus status, Pageable pageable);
    Page<UserKyc> findAll(Pageable pageable);
}
