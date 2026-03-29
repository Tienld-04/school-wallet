package com.ldt.user.repository;

import com.ldt.user.model.User;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByPhone(String phone);

    List<User> findByPhoneIn(List<String> phones);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

}
