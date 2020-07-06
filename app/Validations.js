import {
  compose,
  curry,
  isEmpty,
  isNil,
  length,
  gte,
  test,
  not,
  view,
  set,
  contains,
  map,
  toUpper,
} from "ramda"
import { Success, Failure } from "data.validation"
import Maybe from "data.maybe"

export const getOrElse = (val) => (x) => x.getOrElse(val)

export const validate = curry((rule, lens, msg, data) =>
  rule(view(lens, data)) ? Success(data) : Failure([set(lens, msg, {})])
)

export const isRequired = compose(not, isEmpty)

export const IsNotNil = compose(not, isNil)

export const isNotNullOrEmpty = (data) => !isNullOrEmpty(data)

export const isNullOrEmpty = (data) => isNil(data) || isEmpty(data)

export const maxLength = (max) => compose(gte(max), length)

export const maxSize = curry((max, value) => gte(max, value))

export const emailFormat = test(/@/)

export const onlyAlpha = test(/^[a-zA-Z]*$/)

export const onlyAlphaNumeric = test(/^[a-zA-Z0-9]*$/)

export const onlyAlphaNumericUnderscore = test(/^[a-zA-Z0-9_]*$/)

export const onlyAlphaNumericSpace = test(/^[a-zA-Z0-9\s]*$/)

export const onlyAlphaNumericSpaceUnderscore = test(/^[a-zA-Z0-9_\s]*$/)

export const onlyAlphaNumericSpaceSpecial = test(
  /^[a-zA-Z0-9_.~!*''();:@&=+$,/?#[%-\]+\s]*$/
)

export const phoneFormat = test(/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/)

export const urlFormat = test(/^[a-zA-Z0-9_.~!*''();:@&=+$,/?#[%-\]+]*$/)

export const onlyNumeric = test(/^[0-9]*$/)

export const maxLengthNullable = (max) =>
  compose(getOrElse(false), map(gte(max)), map(length), Maybe.fromNullable)

export const unique = curry((keys, value) => {
  let lookup = Maybe.fromNullable(keys)
  return !contains(
    toUpper(value.toString()),
    map((y) => toUpper(y.toString()), lookup.getOrElse([]))
  )
})

export const inDateRange = curry((start, end, value) => {
  if (value == null || value === "") {
    return true
  }

  return new Date(start) <= new Date(value) && new Date(value) < new Date(end)
})

export const allCaps = (str) => str.toUpperCase() === str

export const isNilOrEmptyOrAtom = (item) =>
  isNil(item) || isEmpty(item) || item === "{$type:atom}"
