package com.TreeNut.ChatBot_Backend.repository

import com.TreeNut.ChatBot_Backend.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface UserRepository : JpaRepository<User, String> {

}