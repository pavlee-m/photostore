package com.example.photostore.entity;

import java.time.Instant;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "albums")
public class Album {
    
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String name;
    
    @Column(nullable=false)
    private String description;

    @Column(nullable=false)
    private Instant createdAt;

    @Column(nullable=true)
    private String coverPhotoUrl;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy="album")
    private List<AlbumMedia> albumMedia;

}
