package wgu.edu.BrinaBright.Entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import wgu.edu.BrinaBright.Enums.Role;

import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "users")
@Data
@NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(unique = true, name = "email")
    private String email;

    @Column( name = "passwordhash")
    private String passwordHash; // (store hash!)



    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @OrderBy("billDate DESC")
    private List<UserBill> bills = new ArrayList<>();


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "municipality_id", nullable = false)
    private Municipality municipality;

    public String getStringRole() {
        return role.toString();
    }

    public Role getRole() {
        return role;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    public Long getMunicipalityId() {
        return this.municipality != null ? this.municipality.getId() : null;
    }


}

