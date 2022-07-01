/*
  Se encarga de establecer la hora de 0-1440 al formato 24h
*/

const integerToHour = (integer) => {
    let hours = Math.floor(integer / 60)
    const minutes = integer - hours * 60

    if (hours <= 9) {
        hours = '0' + hours
    }

    if (minutes == 0) {
        return `${hours}:00h`
    } else if (minutes <= 9) return `${hours}:0${minutes}h`

    return `${hours}:${minutes}h`
}

module.exports = { integerToHour }
