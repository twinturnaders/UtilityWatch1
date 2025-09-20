package wgu.edu.BrinaBright.Repos;

import org.springframework.data.jpa.repository.JpaRepository;
import wgu.edu.BrinaBright.Entities.CrowdSubmission;
import wgu.edu.BrinaBright.Enums.SubmissionStatus;

import java.util.List;

public interface CrowdSubmissionRepository extends JpaRepository<CrowdSubmission, Long> {
    List<CrowdSubmission> findByStatusOrderByCreatedAtAsc(SubmissionStatus status);


}