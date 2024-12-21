// package com.TreeNut.ChatBot_Backend.controller

// import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken
// import org.springframework.security.oauth2.core.user.OAuth2User
// import org.springframework.stereotype.Controller
// import org.springframework.ui.Model
// import org.springframework.web.bind.annotation.GetMapping
// import javax.servlet.http.HttpSession

// @Controller
// class HomeController {

//     @GetMapping("/home")
//     fun home(authentication: OAuth2AuthenticationToken, session: HttpSession, model: Model): String {
//         val oAuth2User = authentication.principal as OAuth2User
//         val attributes = oAuth2User.attributes

//         // 사용자 정보 추출
//         val id = attributes["sub"] as String
//         val email = attributes["email"] as String
//         val name = attributes["name"] as String
//         val picture = attributes["picture"] as String
//         val familyName = attributes["family_name"] as String
//         val givenName = attributes["given_name"] as String

//         // 세션에 사용자 정보 저장 (옵션)
//         session.setAttribute("user", mapOf(
//             "id" to id,
//             "email" to email,
//             "name" to name,
//             "picture" to picture,
//             "familyName" to familyName,
//             "givenName" to givenName
//         ))

//         // Thymeleaf에 사용자 정보 전달
//         model.addAttribute("id", id)
//         model.addAttribute("email", email)
//         model.addAttribute("name", name)
//         model.addAttribute("picture", picture)
//         model.addAttribute("familyName", familyName)
//         model.addAttribute("givenName", givenName)

//         return "home" // home.html 템플릿 렌더링
//     }

//     @GetMapping("/logout")
//     fun logout(session: HttpSession): String {
//         session.invalidate() // 세션 삭제
//         return "redirect:/auth/login"
//     }
// }
