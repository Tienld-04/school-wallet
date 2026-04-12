package com.ldt.user.repository;

import com.ldt.user.model.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.ldt.user.model.MerchantType;

import java.util.List;
import java.util.UUID;

public interface MerchantRepository extends JpaRepository<Merchant, UUID>, JpaSpecificationExecutor<Merchant> {
    boolean existsByName(String name);
    boolean existsByNameAndMerchantIdNot(String name, UUID merchantId);
    List<Merchant> findByUser_UserId(UUID userId);
    List<Merchant> findByActiveTrue();
    List<Merchant> findByActiveTrueAndType(MerchantType type);
}
