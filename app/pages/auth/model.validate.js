import { curryN, identity, lensProp, mergeAll } from "ramda"
import { Success } from "data.validation"
import { validate, isRequired, emailFormat } from "Validations"
const ValidateRegistration = Success(curryN(3, identity))
const ValidateLogin = Success(curryN(2, identity))

const nameLense = lensProp("name")
const passwordLense = lensProp("password")
const emailLense = lensProp("email")

const NAME_REQUIRED_MSG = "A Name is required"
const PASSWORD_REQUIRED_MSG = "A Password is required"
const EMAIL_REQUIRED_MSG = "An Email is required"
const INVALID_EMAIL_FORMAT = "Email must be a valid format"

const validateName = (data) =>
  Success(data).apLeft(validate(isRequired, nameLense, NAME_REQUIRED_MSG, data))

const validateEmail = (data) =>
  Success(data)
    .apLeft(validate(isRequired, emailLense, EMAIL_REQUIRED_MSG, data))
    .apLeft(validate(emailFormat, emailLense, INVALID_EMAIL_FORMAT, data))

const validatePassword = (data) =>
  Success(data).apLeft(
    validate(isRequired, passwordLense, PASSWORD_REQUIRED_MSG, data)
  )

export const validateRegisterTask = (data) =>
  ValidateRegistration.ap(validateName(data))
    .ap(validateEmail(data))
    .ap(validatePassword(data))
    .failureMap(mergeAll)
    .toTask()

export const validateLoginTask = (data) =>
  ValidateLogin.ap(validateEmail(data))
    .ap(validatePassword(data))
    .failureMap(mergeAll)
    .toTask()
