package wgu.edu.BrinaBright.Security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import wgu.edu.BrinaBright.Services.UserDetailServiceImpl;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailServiceImpl userDetailService;

    @Bean

        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                    .cors(Customizer.withDefaults())
                    .csrf(csrf -> csrf.ignoringRequestMatchers("/actuator/**", "/api/auth/**", "/api/**"))
                    .authorizeHttpRequests(auth -> auth
                            // allow preflight for everyone
                            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                    .requestMatchers("/actuator/**").permitAll()
                                    .requestMatchers("/api/auth/**").permitAll()
                                    .requestMatchers("/api/rates/**").permitAll()
                                    .requestMatchers("/api/municipalities/**").permitAll()
                                    .requestMatchers("/api/towns/**").permitAll()
                                    .requestMatchers("/api/towns/names").permitAll()
                                    .requestMatchers("/api/submissions/submit", "/api/submissions/submit/**").permitAll()
                                    .requestMatchers(HttpMethod.POST,"/api/submissions/submit").permitAll()
                                    .requestMatchers("/api/userbills").authenticated()
                                    .requestMatchers(HttpMethod.POST,"/api/userbills").authenticated()
                                    .requestMatchers("/api/userbills/**").authenticated()
                                    .requestMatchers("/api/users/**").authenticated()
                                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                    .anyRequest().authenticated()
                    );



                http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(userDetailService)
                .passwordEncoder(passwordEncoder())
                .and()
                .build();
    }


    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("https://utilitywatch.org", "http://localhost:4200"));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
        cfg.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

}
