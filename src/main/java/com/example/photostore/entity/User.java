package com.example.photostore.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name="users")
public class User {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(unique=true)
    private String email;

    @Column(nullable=false)
    private String password;

    @Column(nullable=true)
    private String profile_picture_url;

    // This is the storage size specified in MB, default is 25GB, modified by admin.
    @Column(nullable=false, columnDefinition="float default 25600.0")
    private Float storage_space;

    @Column(nullable=false)
    private Float storage_used;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable=false)
    private Role role;

    @Column(nullable=false, columnDefinition="VARBINARY(512)")
    private byte[] encryption_key;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Album> albums = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MediaFile> mediaFiles = new ArrayList<>();

}
