package wgu.edu.BrinaBright.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import wgu.edu.BrinaBright.Entities.AverageRate;

@Data
@AllArgsConstructor
public class AverageRateDTO {

    private Double avgWaterRate;
    private Double avgSewerRate;
    private Double avgCombinedTotalRate;
    private Integer lastInformationFoundYear;

    public static AverageRateDTO from(AverageRate ar) {
        return new AverageRateDTO(
                ar.getAvgWaterRate(),
                ar.getAvgSewerRate(),
                ar.getAvgCombinedTotalRate(),
                ar.getLastInformationFoundYear()
        );
    }
}
