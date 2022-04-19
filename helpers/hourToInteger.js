
const integerToHour = (integer) => {
    const hours = Math.floor(integer/60);
    const minutes = integer - (hours * 60);
    if(minutes == 0){
        return `${hours}:00h`
    }
    return `${hours}:${minutes}h`;
}


module.exports = {integerToHour}