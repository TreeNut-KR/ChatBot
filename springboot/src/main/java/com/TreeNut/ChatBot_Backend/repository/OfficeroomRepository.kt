package com.TreeNut.ChatBot_Backend.repository

import com.TreeNut.ChatBot_Backend.model.Officeroom
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OfficeroomRepository : JpaRepository<Officeroom, Long> {
    fun findByUserid(userId: String): Officeroom?
}
