package org.project.oauth.helper.converter

import org.project.oauth.helper.constants.SocialLoginType
import org.springframework.context.annotation.Configuration
import org.springframework.core.convert.converter.Converter

@Configuration
class SocialLoginTypeConverter : Converter<String, SocialLoginType> {
    override fun convert(s: String): SocialLoginType {
        return SocialLoginType.valueOf(s.uppercase())
    }
}


//완