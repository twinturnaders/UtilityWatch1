package wgu.edu.BrinaBright.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import wgu.edu.BrinaBright.Entities.CrowdSubmission;
import wgu.edu.BrinaBright.Services.CrowdSubmissionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/submissions")
@RequiredArgsConstructor
public class AdminSubmissionsController {

    private final CrowdSubmissionService service;
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<CrowdSubmission> allSubmissions(){
    return service.findAll();
    }


    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CrowdSubmission> pending() {
        return service.findPending();
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approve(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long municipalityId = body.get("municipalityId");
        if (municipalityId == null) return ResponseEntity.badRequest().body("municipalityId required");
        service.approve(id, municipalityId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        service.reject(id, reason);
        return ResponseEntity.ok().build();
    }
}