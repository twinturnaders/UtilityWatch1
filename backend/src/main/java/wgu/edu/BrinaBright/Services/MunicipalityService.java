package wgu.edu.BrinaBright.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wgu.edu.BrinaBright.DTOs.*;
import wgu.edu.BrinaBright.Entities.AverageRate;
import wgu.edu.BrinaBright.Entities.Municipality;
import wgu.edu.BrinaBright.Entities.SewerRate;
import wgu.edu.BrinaBright.Entities.SewerRateVariance;
import wgu.edu.BrinaBright.Entities.WaterRate;
import wgu.edu.BrinaBright.Repos.MunicipalityRepository;

import java.math.BigDecimal;
import java.util.List;

import static java.util.stream.Collectors.toList;

@Service
@RequiredArgsConstructor
public class MunicipalityService {

    private final MunicipalityRepository municipalityRepository;
    private final RateCalculatorService rateCalculatorService;







    public List<RateSummaryDTO> findNearbyRates(String zip, double radiusMeters, double usageGal) {
        List<Municipality> municipalities = municipalityRepository.findMunicipalitiesNearZip(zip, radiusMeters);
        System.out.println("Found " + municipalities.size() + " municipalities near ZIP: " + zip);
        if (municipalities.isEmpty()) {
            System.out.println("No results found for ZIP. Returning all municipalities.");
            municipalities = municipalityRepository.findAll();
        }
        return municipalities.stream()
                .map(m -> mapToRateSummary(m, (int) usageGal))
                .toList();
    }

    private List<RateVarianceDTO> getWaterVariances(Municipality m) {
        return m.getRateVariances().stream()
                .filter(rv -> rv.getWaterPPU() != null)
                .map(RateVarianceDTO::fromWater)
                .toList();
    }
    private SewerRateDTO getSewerRateDTO(Municipality m) {
        SewerRate rate = m.getSewerRates().stream().findFirst().orElse(null);
        if (rate == null) return null;

        return new SewerRateDTO(
                rate.getBaseRate(),
                rate.getBaseIncludedGal(),
                rate.getFixedRate(),
                Boolean.TRUE.equals(rate.getFixedRate()) ? "Fixed rate" : "Rate varies by use"

        );
    }

    private SewerRateVarianceDTO getSewerRateVarianceDTO(Municipality m) {
        SewerRateVariance sewerVariance = m.getSewerRateVariances().stream().findFirst().orElse(null);
        if (sewerVariance == null) return null;
        return new SewerRateVarianceDTO(
                sewerVariance.getSewerPpu()
        );
    }

    private WaterRateDTO getWaterRateDTO(Municipality m) {
        WaterRate rate = m.getWaterRates().stream().findFirst().orElse(null);
        if (rate == null) return null;

        return new WaterRateDTO(
                rate.getBaseRate(),
                rate.getBaseGal(),
                rate.getFixedRate(),
                Boolean.TRUE.equals(rate.getFixedRate()) ? "Fixed rate" : "Rate varies by use"

        );
    }

    private RateSummaryDTO mapToRateSummary(Municipality m, Integer usageGal) {
        AverageRate avg = m.getAverageRate();
        boolean isAverageOnly = avg != null && m.getWaterRates().isEmpty() && m.getSewerRates().isEmpty();

        if (isAverageOnly) {
            return RateSummaryDTO.builder()
                    .name(m.getName())
                    .county(m.getCounty())
                    .state(m.getState())
                    .isAverageOnly(true)
                    .averageRates(AverageRateDTO.from(avg))
                    .confidenceRating(m.getConfidenceRating() == null ? 0 : m.getConfidenceRating().trim().length())
                    .build();
        }

        WaterRate water = m.getWaterRates().stream().findFirst().orElse(null);

        List<FeeDTO> fees = m.getFees().stream()
                .filter(f -> Boolean.TRUE.equals(f.getBaseFee()))
                .map(FeeDTO::fromEntity)
                .toList();

        BigDecimal estWater = (usageGal != null)
                ? rateCalculatorService.calculateWaterCharge(m, usageGal)
                : null;

        BigDecimal estSewer = (usageGal != null)
                ? rateCalculatorService.calculateSewerCharge(m, usageGal)
                : null;

        return RateSummaryDTO.builder()
                .name(m.getName())
                .county(m.getCounty())
                .state(m.getState())
                .waterBaseRate(water != null ? water.getBaseRate() : null)
                .waterFixed(water != null ? water.getFixedRate() : null)
                .waterBaseGal(water != null ? water.getBaseGal() : null)
                .waterVariances(getWaterVariances(m))
                .sewerRate(getSewerRateDTO(m))
                .sewerRateVariance(getSewerRateVarianceDTO(m))
                .baseFees(fees)
                .estimatedWaterCharge(estWater)
                .estimatedSewerCharge(estSewer)
                .confidenceRating(m.getConfidenceRating() == null ? 0 : m.getConfidenceRating().trim().length())
                .build();
    }


}