package wgu.edu.BrinaBright.Entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Geometry;

import java.util.ArrayList;
import java.util.List;




@Entity @Table(name = "municipalities")
@Data
@NoArgsConstructor
public class Municipality {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "zip_center")
    private Geometry zipCenter;

    @Column(name = "name")
    private String name;

    @Column(name = "state")
    private String state;

    @Column(name="county")
    private String county;

    @Column(name = "geo_bounds")
    private Geometry geoBounds;

    @Column(name = "confidence_rating")
    private String confidenceRating;

    @OneToMany(mappedBy = "municipality", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @OrderBy("effectiveStart ASC")
    private List<WaterRate> waterRates = new ArrayList<>();

    @OneToMany(mappedBy = "municipality", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @OrderBy("effectiveStart ASC")
    private List<SewerRate> sewerRates = new ArrayList<>();

    @OneToMany(mappedBy = "municipality", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    private List<Fee> fees = new ArrayList<>();

    // Variances (tiers, thresholds, surcharges) for WATER or SEWER
    @OneToMany(mappedBy = "municipality", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @OrderBy(" waterRangeMin ASC")
    private List<RateVariance> rateVariances = new ArrayList<>();

    @OneToMany(mappedBy = "municipality", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @OrderBy(" effectiveStart ASC")
    private List<SewerRateVariance> sewerRateVariances = new ArrayList<>();

    @OneToOne(mappedBy = "municipality", fetch = FetchType.LAZY)
    private AverageRate averageRate;
}
