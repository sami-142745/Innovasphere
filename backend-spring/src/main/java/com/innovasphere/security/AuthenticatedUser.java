package com.innovasphere.security;

import com.innovasphere.enums.Role;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Spring Security principal that carries the {@link User#tokenVersion} alongside
 * the username. JWT validation compares the token claim to this version, so
 * incrementing {@code tokenVersion} (for example on logout) invalidates every
 * previously issued access token for the user.
 */
public class AuthenticatedUser implements UserDetails {

    private final UUID id;
    private final String email;
    private final String passwordHash;
    private final Role role;
    private final boolean active;
    private final int tokenVersion;

    public AuthenticatedUser(
        UUID id,
        String email,
        String passwordHash,
        Role role,
        boolean active,
        int tokenVersion
    ) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
        this.tokenVersion = tokenVersion;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new RoleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }

    private static final class RoleGrantedAuthority implements GrantedAuthority {

        private final String authority;

        RoleGrantedAuthority(String authority) {
            this.authority = authority;
        }

        @Override
        public String getAuthority() {
            return authority;
        }
    }
}
