package com.TreeNut.ChatBot_Backend.model

data class GoogleTokenResponse(
    val access_token: String,
    val expires_in: Int,
    val token_type: String
)

data class GoogleUserInfo(
    val email: String,
    val name: String,
    val picture: String
)

data class GoogleTokenRequest(
    val code: String,
    val client_id: String,
    val client_secret: String,
    val redirect_uri: String
)
