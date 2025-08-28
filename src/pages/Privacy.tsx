// src/pages/Privacy.tsx
export default function Privacy() {
    return (
        <div className="prose max-w-3xl">
            <h1>개인정보처리방침</h1>
            <p>우리는 서비스 제공에 필요한 최소한의 개인정보만 수집하며, 목적 외 이용/제3자 제공을 하지 않습니다.</p>
            <ul>
                <li>수집 항목: 계정 식별자(이메일/전화), 닉네임, 이용 로그</li>
                <li>보관 기간: 관련 법령에 따르며, 탈퇴 시 지체 없이 파기</li>
                <li>문의: support@your-domain.com</li>
            </ul>
        </div>
    );
}
