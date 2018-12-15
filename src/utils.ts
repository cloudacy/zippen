// https://docs.microsoft.com/en-us/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
export function dateToFatDate(date: Date) {
  return date.getDay() | ((date.getMonth() + 1) << 5) | ((date.getFullYear() - 1980) << 9)
}

// https://docs.microsoft.com/en-us/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
export function dateToFatTime(date: Date) {
  return (date.getSeconds() >> 1) | (date.getMinutes() << 5) | (date.getHours() << 11)
}
