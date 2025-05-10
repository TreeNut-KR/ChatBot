import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../SideBar/SideBar';

interface PrivacyConsentProps {
  onAgree?: () => void;
}

const privacyMarkdown = `
# 개인정보처리방침

---

## 제1조(목적)

**트리넛**(이하 ‘회사'라고 함)는 회사가 제공하고자 하는 서비스(이하 ‘회사 서비스’)를 이용하는 개인(이하 ‘이용자’ 또는 ‘개인’)의 정보(이하 ‘개인정보’)를 보호하기 위해, 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 '정보통신망법') 등 관련 법령을 준수하고, 서비스 이용자의 개인정보 보호 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침(이하 ‘본 방침’)을 수립합니다.

---

## 제2조(개인정보 처리의 원칙)

개인정보 관련 법령 및 본 방침에 따라 회사는 이용자의 개인정보를 수집할 수 있으며 수집된 개인정보는 개인의 동의가 있는 경우에 한해 제3자에게 제공될 수 있습니다. 단, 법령의 규정 등에 의해 적법하게 강제되는 경우 회사는 수집한 이용자의 개인정보를 사전에 개인의 동의 없이 제3자에게 제공할 수도 있습니다.

---

## 제3조(회원 가입을 위한 정보)

회사는 이용자의 회사 서비스에 대한 회원가입을 위하여 다음과 같은 정보를 수집합니다.

- **필수 수집 정보:** 이메일 주소, 비밀번호, 이름 및 닉네임
- **선택 수집 정보:** 업로드 사진

---

## 제4조(본인 인증을 위한 정보)

회사는 이용자의 본인인증을 위하여 다음과 같은 정보를 수집합니다.

- **필수 수집 정보:** 이메일 주소

---

## 제5조(회사 서비스 제공을 위한 정보)

회사는 이용자에게 회사의 서비스를 제공하기 위하여 다음과 같은 정보를 수집합니다.

- **필수 수집 정보:** 아이디, 이메일 주소 및 이름

---

## 제6조(서비스 이용 및 부정 이용 확인을 위한 정보)

회사는 이용자의 서비스 이용에 따른 통계∙분석 및 부정이용의 확인∙분석을 위하여 다음과 같은 정보를 수집합니다.  
(부정이용이란 회원탈퇴 후 재가입, 상품구매 후 구매취소 등을 반복적으로 행하는 등 회사가 제공하는 할인쿠폰, 이벤트 혜택 등의 경제상 이익을 불·편법적으로 수취하는 행위, 이용약관 등에서 금지하고 있는 행위, 명의도용 등의 불·편법행위 등을 말합니다.)

1. **필수 수집 정보:** 서비스 이용기록, 쿠키 및 접속지 정보
2. 이용자가 회사가 발송한 이메일을 수신받아 개인정보를 입력하는 방식
3. 본 사이트에서 입력한 채팅 기록 및 캐릭터 생성을 통한 캐릭터 정보
4. 신규 서비스 개발을 위한 경우
5. 이벤트 및 행사 안내 등 마케팅을 위한 경우

---

## 제7조(광고성 정보의 전송 조치)

1. 회사는 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우 이용자의 명시적인 사전동의를 받습니다. 다만, 다음 각호 어느 하나에 해당하는 경우에는 사전 동의를 받지 않습니다.
    1. 회사가 재화 등의 거래관계를 통하여 수신자로부터 직접 연락처를 수집한 경우, 거래가 종료된 날로부터 6개월 이내에 회사가 처리하고 수신자와 거래한 것과 동종의 재화 등에 대한 영리목적의 광고성 정보를 전송하려는 경우
    2. 「방문판매 등에 관한 법률」에 따른 전화권유판매자가 육성으로 수신자에게 개인정보의 수집출처를 고지하고 전화권유를 하는 경우
2. 회사는 전항에도 불구하고 수신자가 수신거부의사를 표시하거나 사전 동의를 철회한 경우에는 영리목적의 광고성 정보를 전송하지 않으며 수신거부 및 수신동의 철회에 대한 처리 결과를 알립니다.
3. 회사는 오후 9시부터 그다음 날 오전 8시까지의 시간에 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우에는 제1항에도 불구하고 그 수신자로부터 별도의 사전 동의를 받습니다.
4. 회사는 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우 다음의 사항 등을 광고성 정보에 구체적으로 밝힙니다.
    1. 회사명 및 연락처
    2. 수신 거부 또는 수신 동의의 철회 의사표시에 관한 사항의 표시
5. 회사는 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우 다음 각 호의 어느 하나에 해당하는 조치를 하지 않습니다.
    1. 광고성 정보 수신자의 수신거부 또는 수신동의의 철회를 회피·방해하는 조치
    2. 숫자·부호 또는 문자를 조합하여 전화번호·전자우편주소 등 수신자의 연락처를 자동으로 만들어 내는 조치
    3. 영리목적의 광고성 정보를 전송할 목적으로 전화번호 또는 전자우편주소를 자동으로 등록하는 조치
    4. 광고성 정보 전송자의 신원이나 광고 전송 출처를 감추기 위한 각종 조치
    5. 영리목적의 광고성 정보를 전송할 목적으로 수신자를 기망하여 회신을 유도하는 각종 조치

---

## 제8조(아동의 개인정보보호)

1. 회사는 만 14세 미만 아동의 개인정보 보호를 위하여 만 14세 이상의 이용자에 한하여 회원가입을 허용합니다.

---

## 제9조(이용자의 의무)

1. 이용자는 자신의 개인정보를 최신의 상태로 유지해야 하며, 이용자의 부정확한 정보 입력으로 발생하는 문제의 책임은 이용자 자신에게 있습니다.
2. 타인의 개인정보를 도용한 회원가입의 경우 이용자 자격을 상실하거나 관련 개인정보보호 법령에 의해 처벌받을 수 있습니다.
3. 이용자는 전자우편주소, 비밀번호 등에 대한 보안을 유지할 책임이 있으며 제3자에게 이를 양도하거나 대여할 수 없습니다.

---

## 제10조(회사의 개인정보 보호 책임자 지정)

회사는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보 보호 책임자를 지정하고 있습니다.

- **개인정보 보호 책임자**
    - 성명: **김준건**
    - 직책: **CEO**
    - 전화번호: **010-7549-6378**
    - 이메일: **treenutcorp@gmail.com**

---

## 제11조(권익침해에 대한 구제방법)

1. 정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다. 이 밖에 기타 개인정보침해의 신고, 상담에 대하여는 아래의 기관에 문의하시기 바랍니다.
    - 개인정보분쟁조정위원회 : (국번없이) 1833-6972 ([www.kopico.go.kr](https://www.kopico.go.kr))
    - 개인정보침해신고센터 : (국번없이) 118 ([privacy.kisa.or.kr](https://privacy.kisa.or.kr))
    - 대검찰청 : (국번없이) 1301 ([www.spo.go.kr](https://www.spo.go.kr))
    - 경찰청 : (국번없이) 182 ([ecrm.cyber.go.kr](https://ecrm.cyber.go.kr))
2. 회사는 정보주체의 개인정보자기결정권을 보장하고, 개인정보침해로 인한 상담 및 피해 구제를 위해 노력하고 있으며, 신고나 상담이 필요한 경우 제1항의 담당부서로 연락해주시기 바랍니다.
3. 개인정보 보호법 제35조(개인정보의 열람), 제36조(개인정보의 정정·삭제), 제37조(개인정보의 처리정지 등)의 규정에 의한 요구에 대하여 공공기관의 장이 행한 처분 또는 부작위로 인하여 권리 또는 이익의 침해를 받은 자는 행정심판법이 정하는 바에 따라 행정심판을 청구할 수 있습니다.
    - 중앙행정심판위원회 : (국번없이) 110 ([www.simpan.go.kr](https://www.simpan.go.kr))

---
`;

const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
};

const PrivacyConsent: React.FC<PrivacyConsentProps> = ({ onAgree }) => {
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreePrivacy && agreeAge) {
      setCookie('agree_privacy', agreePrivacy ? '1' : '0');
      setCookie('agree_age', agreeAge ? '1' : '0');
      navigate('/register');
      if (onAgree) onAgree();
    }
  };

  const params = new URLSearchParams(window.location.search);
  const isModal = params.get('modal') === '1';

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#1a1918] text-white z-[9999]"
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* 사이드바는 모달이 아닐 때만 렌더링 */}
      {!isModal && <Sidebar />}
      <main className="flex flex-1 w-full h-full items-center justify-center">
        <div className="w-full max-w-2xl bg-[#2a2928] rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">약관 동의</h2>
          <div
            className="mb-10 bg-[#232221] rounded p-4 text-gray-200 text-sm border border-[#3f3f3f] whitespace-pre-wrap font-sans"
            style={{
              maxHeight: '28rem',
              overflowY: 'auto',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeRaw]}
            >
              {privacyMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyConsent;