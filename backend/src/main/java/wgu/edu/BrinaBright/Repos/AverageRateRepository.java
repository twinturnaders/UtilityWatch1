package wgu.edu.BrinaBright.Repos;

import org.springframework.data.jpa.repository.JpaRepository;
import wgu.edu.BrinaBright.Entities.AverageRate;

import java.util.Optional;

public interface AverageRateRepository extends JpaRepository<AverageRate, Integer> {
    Optional<AverageRate> findByMunicipalityId(Long municipalityId);
}
