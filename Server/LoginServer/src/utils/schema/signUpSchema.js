import * as yup from 'yup';

const signUpSchema = yup.object().shape({
    email: yup
        .string()
        .required('이메일을 입력해 주세요.')
        .email('유효하지 않은 이메일 형식입니다.'), // `matches` 대신 `email()` 메서드 사용

    password: yup
        .string()
        .required('비밀번호를 입력해 주세요.')
        .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/, '비밀번호는 영문자와 숫자를 포함해야 합니다.'), // 별도의 설명 추가

    nickname: yup
        .string()
        .required('닉네임을 입력해 주세요.')
        .min(2, '닉네임은 2자 이상이어야 합니다.')
        .max(10, '닉네임은 10자 이하여야 합니다.')
        .matches(/^[a-zA-Z가-힣0-9_]+$/, '닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.'),
});


export default signUpSchema;
