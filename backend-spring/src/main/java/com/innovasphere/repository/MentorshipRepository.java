package com.innovasphere.repository;

import com.innovasphere.entity.Mentorship;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MentorshipRepository extends JpaRepository<Mentorship, UUID> {

    List<Mentorship> findByFacultyId(UUID facultyId);

    List<Mentorship> findByStudentId(UUID studentId);

    boolean existsByFacultyIdAndStudentId(UUID facultyId, UUID studentId);

    boolean existsByFaculty_IdAndProject_Id(UUID facultyId, UUID projectId);

    boolean existsByFaculty_UserIdAndStudent_Id(UUID facultyUserId, UUID studentId);

    long countByFacultyId(UUID facultyId);

    @Query("""
        select m.faculty.id as facultyId, count(m.id) as count
        from Mentorship m
        where m.faculty.id in :facultyIds
        group by m.faculty.id
        """)
    List<Object[]> countByFacultyIds(@Param("facultyIds") Collection<UUID> facultyIds);

    void deleteByProjectId(UUID projectId);
}