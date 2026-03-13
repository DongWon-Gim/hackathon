import { ERROR } from './error'

export function validateEmail(email: string) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw ERROR.VALIDATION_ERROR('이메일 형식이 올바르지 않습니다')
  }
}

export function validatePassword(password: string) {
  if (!password || password.length < 8) {
    throw ERROR.VALIDATION_ERROR('비밀번호는 최소 8자 이상이어야 합니다')
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    throw ERROR.VALIDATION_ERROR('비밀번호는 영문과 숫자를 포함해야 합니다')
  }
}

export function validateRequired(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') {
    throw ERROR.VALIDATION_ERROR(`${fieldName}은(는) 필수 입력 항목입니다`)
  }
}

export function validateMaxLength(value: string, max: number, fieldName: string) {
  if (value.length > max) {
    throw ERROR.VALIDATION_ERROR(`${fieldName}은(는) ${max}자를 초과할 수 없습니다`)
  }
}
