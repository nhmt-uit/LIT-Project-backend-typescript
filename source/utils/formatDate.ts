const moment = require('moment');

export const formatDateToTimestamp = (dateString: string, format: string) => {
    return moment(dateString, format).unix();
}

export const formatTimestampToDate = (timestamp: number, format: string) => {

}