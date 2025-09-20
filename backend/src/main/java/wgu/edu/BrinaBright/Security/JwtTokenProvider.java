package wgu.edu.BrinaBright.Security;

import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs}")
    private int jwtExpirationMs;

    public String generateToken(UserPrincipal user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());

        claims.put("roles", user.getAuthorities()
                .stream().map(a -> a.getAuthority()).collect(Collectors.toList()));

        return Jwts.builder()
                .setSubject(String.valueOf(user.getId()))            // sub = id  ✅
                .addClaims(claims)                                   // email + roles
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token).getBody();
    }

    public Long getUserIdFromToken(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public String getEmail(String token) {
        Object v = parseClaims(token).get("email");
        return v != null ? v.toString() : null;
    }


    public List<String> getRoles(String token) {
        Object r = parseClaims(token).get("roles");
        if (r instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return List.of();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}