package wgu.edu.BrinaBright.DTOs;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
@Data
@NoArgsConstructor
@lombok.AllArgsConstructor
@lombok.Builder

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RateSummaryDTO {


    private String name;
    private String county;
    private String state;
    private BigDecimal waterBaseRate;
    private Boolean waterFixed;
    private Integer waterBaseGal;
    private List<RateVarianceDTO> waterVariances;
    private SewerRateDTO sewerRate;
    private SewerRateVarianceDTO sewerRateVariance;
    private List<FeeDTO> baseFees;
    private BigDecimal estimatedWaterCharge;
    private BigDecimal estimatedSewerCharge;
    private Integer confidenceRating;

    /** True when rate data comes from the average_rates table, not actual tariffs. */
    private Boolean isAverageOnly;
    private AverageRateDTO averageRates;


    public BigDecimal getEstTotal() {
        if (estimatedWaterCharge == null && estimatedSewerCharge == null) return null;
        BigDecimal water = estimatedWaterCharge == null ? BigDecimal.ZERO : estimatedWaterCharge;
        BigDecimal sewer = estimatedSewerCharge == null ? BigDecimal.ZERO : estimatedSewerCharge;

       return water.add(sewer);
    }

}




