package com.example.photostore.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.example.photostore.service.CustomUserDetailsService;
import com.example.photostore.service.RefreshTokenService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private RefreshTokenService refreshTokenService;
    

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String jwt = parseJwt(request, "accessToken");
        String email = "";
        if (jwt != null && jwtUtil.validateJwtToken(jwt)) {
            email = jwtUtil.getUserFromToken(jwt);
        }
        else {
            String refreshToken = parseJwt(request, "refreshToken");
            if (refreshToken != null && refreshTokenService.isRefreshTokenValid(refreshToken)) {
                email = jwtUtil.getUserFromToken(refreshToken);
                GeneratedToken accessToken = jwtUtil.generateToken(email);
                response.setHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("accessToken", accessToken.token()).path("/").httpOnly(true).build().toString());
            }
            else {
                log.error("Refresh token is invalid, logging out...");
                if (refreshToken != null) {
                    refreshTokenService.deleteRefreshToken(refreshToken);
                }
                return;
            }
        }
        final UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(userDetails,null, userDetails.getAuthorities());
        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request, String tokenType) {
        Cookie[] accessTokenCookie = request.getCookies();
        for (Cookie cookie : accessTokenCookie) {
            if (cookie.getName().equals(tokenType)) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
