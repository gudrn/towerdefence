import * as yup from 'yup';

const signUpSchema = yup.object().shape({
    email: yup.string()
        .required('이메일이 누락되었습니다.')
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '유효하지 않은 이메일 형식입니다.'),
    password: yup.string()
        .required('비밀번호가 누락되었습니다.')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, '비밀번호는 최소 8자 이상의 영문자, 숫자를 포함해야 합니다.'),
    nickname: yup.string()
        .required('닉네임이 누락되었습니다.')
        .min(2, '닉네임은 2자 이상이어야 합니다.')
        .max(10, '닉네임은 10자 이하여야 합니다.')
        .matches(/^[a-zA-Z가-힣0-9_]+$/, '닉네임에는 특수문자를 사용할 수 없습니다.')
});

export default signUpSchema;
