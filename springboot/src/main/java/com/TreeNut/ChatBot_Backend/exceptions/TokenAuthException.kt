package com.TreeNut.ChatBot_Backend.exceptions

class TokenExpiredException(message: String) : RuntimeException(message)
class TokenMalformedException(message: String) : RuntimeException(message)
class TokenSignatureException(message: String) : RuntimeException(message)
class TokenJwtException(message: String) : RuntimeException(message)
