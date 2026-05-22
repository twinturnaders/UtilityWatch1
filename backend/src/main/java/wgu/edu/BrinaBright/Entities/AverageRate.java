package wgu.edu.BrinaBright.Entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "average_rates")
@Data
@NoArgsConstructor
public class AverageRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "municipality_id")
    private Municipality municipality;

    @Column(name = "avg_water_rate")
    private Double avgWaterRate;

    @Column(name = "avg_sewer_rate")
    private Double avgSewerRate;

    @Column(name = "avg_combined_total_rate")
    private Double avgCombinedTotalRate;

    @Column(name = "last_information_found_year")
    private Integer lastInformationFoundYear;
}
