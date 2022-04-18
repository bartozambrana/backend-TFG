
const integerToHour = (integer) => {
    const hours = Math.floor(integer/60);
    const minutes = integer - (hours * 60);
    return `${hours}:${minutes}h`;
}


module.exports = {integerToHour}