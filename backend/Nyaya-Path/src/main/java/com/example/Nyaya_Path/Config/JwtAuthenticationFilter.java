
package com.example.Nyaya_Path.Config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip login and registration endpoints
        if (path.endsWith("/auth/login") ||
                path.endsWith("/auth/register")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = getToken(request);

        // Continue if no token is provided
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Validate and authenticate the user
        if (tokenProvider.validateToken(token)) {

            String email = tokenProvider.getEmail(token);
            String role = tokenProvider.getRole(token);
            String userId = tokenProvider.getUserId(token);

            String authority = "ROLE_" +
                    (role != null ? role.toUpperCase() : "CITIZEN");

            var authentication = new UsernamePasswordAuthenticationToken(
                    email,
                    token,
                    List.of(new SimpleGrantedAuthority(authority))
            );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource()
                            .buildDetails(request)
            );

            request.setAttribute("currentUserId", userId);
            request.setAttribute("currentUserRole", role);
            request.setAttribute("currentUserEmail", email);

            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    // Get JWT from Authorization header or cookie
    private String getToken(HttpServletRequest request) {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {

                if ("NYAYA_SESSION".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }
}
