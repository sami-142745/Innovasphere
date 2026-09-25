package com.innovasphere.repository;

import com.innovasphere.entity.User;
import com.innovasphere.enums.Role;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Page<User> findByRole(Role role, Pageable pageable);

    @Query("""
        select u from User u
        where (:keyword is null
            or lower(u.username) like lower(concat('%', :keyword, '%'))
            or lower(u.fullName) like lower(concat('%', :keyword, '%'))
            or lower(u.email) like lower(concat('%', :keyword, '%')))
        and (:role is null or u.role = :role)
        and (:includeAdmin = true or u.role <> com.innovasphere.enums.Role.ADMIN)
        """)
    Page<User> search(@Param("keyword") String keyword,
                      @Param("role") Role role,
                      @Param("includeAdmin") boolean includeAdmin,
                      Pageable pageable);
}