package com.example.photostore.config;

// import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// import org.springframework.web.cors.CorsConfiguration;
// import org.springframework.web.cors.CorsConfigurationSource;
// import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.photostore.security.AuthEntryPointJwt;
import com.example.photostore.security.AuthTokenFilter;
import com.example.photostore.service.CustomUserDetailsService;

@Configuration
public class WebSecurityConfig {
    
    @Autowired
    CustomUserDetailsService userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public AuthTokenFilter authenticationTokenJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        .exceptionHandling(e -> e.authenticationEntryPoint(unauthorizedHandler))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a
                .requestMatchers("/api/v1/auth/signin").permitAll()
                .requestMatchers("/api/v1/founder/**").permitAll()
                .requestMatchers(
                        "/v3/api-docs",
                        "/v3/api-docs.yaml",
                        "/v3/api-docs/**",
                        "/swagger-ui.html",
                        "/swagger-ui/**")
                .permitAll()
                .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "FOUNDER")
                .anyRequest().authenticated());
        http.addFilterBefore(authenticationTokenJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // @Bean
    // public CorsConfigurationSource corsConfigurationSource() {
    //     // CorsConfiguration configuration = new CorsConfiguration();
    //     // configuration.setAllowedOriginPatterns(List.of("*"));
    //     // configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    //     // configuration.setAllowedHeaders(List.of("*"));
    //     // configuration.setAllowCredentials(true);
    //     // UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    //     // source.registerCorsConfiguration("/**", configuration);
    //     // return source;
    // }

}