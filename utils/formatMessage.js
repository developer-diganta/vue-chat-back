const moment=require("moment");
function formatMessage(name,msg){

  return{
    name,
    msg,
    timeStamp:moment().format('MMMM Do YYYY,h:mm a')
  }
}

module.exports = formatMessage;