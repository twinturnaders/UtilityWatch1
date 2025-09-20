package wgu.edu.BrinaBright.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wgu.edu.BrinaBright.DTOs.CrowdFeeDTO;
import wgu.edu.BrinaBright.DTOs.CrowdRateDTO;
import wgu.edu.BrinaBright.DTOs.CrowdSubmissionDTO;
import wgu.edu.BrinaBright.Entities.CrowdFee;
import wgu.edu.BrinaBright.Entities.CrowdRate;
import wgu.edu.BrinaBright.Entities.CrowdSubmission;
import wgu.edu.BrinaBright.Enums.SubmissionStatus;
import wgu.edu.BrinaBright.Repos.CrowdSubmissionRepository;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CrowdSubmissionService {

    private final CrowdSubmissionRepository submissions;

    @Transactional
    public void saveStructuredSubmission(CrowdSubmissionDTO dto) {
        CrowdSubmission s = new CrowdSubmission();
        if (dto.getTownName() != null) {s.setTownName(dto.getTownName());}
        if (dto.getBaseRate() != null) {s.setRateType(dto.getRateType());}
        if (dto.getTownName() != null){s.setBaseRate(dto.getBaseRate());}
        if (dto.getNotes() != null){s.setNotes(dto.getNotes());}
        s.setSubmittedViaUpload(false);
         s.setStatus(SubmissionStatus.PENDING);

        if (dto.getRateTiers() != null) {
            for (CrowdRateDTO r : dto.getRateTiers()) {
                CrowdRate cr = new CrowdRate();
                cr.setUpTo(r.getUpTo());
                cr.setRate(r.getRate());
                cr.setSubmission(s);
                s.getRateTiers().add(cr);
            }
        }

        if (dto.getFees() != null) {
            for (CrowdFeeDTO f : dto.getFees()) {
                CrowdFee cf = new CrowdFee();
                cf.setName(f.getName());
                cf.setAmount(f.getAmount());
                cf.setSubmission(s);
                s.getFees().add(cf);
            }
        }

        submissions.save(s);
    }

    @Transactional(readOnly = true)
    public List<CrowdSubmission> findPending() {
        return submissions.findByStatusOrderByCreatedAtAsc(SubmissionStatus.PENDING);
    }

    @Transactional
    public void approve(Long id, Long municipalityId) {
        CrowdSubmission s = submissions.findById(id).orElseThrow();
        s.setResolvedMunicipalityId(municipalityId);
        s.setStatus(SubmissionStatus.APPROVED);
        s.setUpdatedAt(Instant.now());
        // OPTIONAL: push into your canonical rate tables here.
    }

    @Transactional
    public void reject(Long id, String reason) {
        CrowdSubmission s = submissions.findById(id).orElseThrow();
        s.setStatus(SubmissionStatus.REJECTED);
        // optionally append reason to notes
        if (reason != null && !reason.isBlank()) {
            s.setNotes((s.getNotes() == null ? "" : s.getNotes() + "\n") + "Rejected: " + reason);
        }
        s.setUpdatedAt(Instant.now());
    }

    public List<CrowdSubmission>  findAll() {
        return submissions.findAll();
    }
}