
const qInput = (name,message,valid = {checkValidity: false, validMessage: ""}) => {
    const output = {
        type: "input",
        name: name,
        message: message
    };
    if(valid.checkValidity) {
        output.validate = function(inputVal) {
            if(!inputVal) {
                console.log(valid.validMessage);
                return false;
            } else {
                return true;
            }
        };
    }
    return output;
};

const qList = (name,message,choices) => {
    const output = {
        type: "list",
        name: name,
        message: message,
        choices: choices,
        default: choices[0]
    };
    return output;
};

const qNumber = (name,message,invalidMssg) => {
    const output = {
        type: "number",
        name: name,
        message: message,
        validate: function(inputVal) {
            if(!inputVal || typeof inputVal !== "number" || inputVal <= 0 || Math.floor(inputVal) !== inputVal) {
                console.log(invalidMssg);
                return false;
            } else {
                return true;
            }
        }
    };
    return output;
};

const qConfirm = (name,message,defaultVal = true) => {
    const output = {
        type: "confirm",
        name: name,
        message: message,
        default: defaultVal
    };
    return output;
};

module.exports = { qInput, qList, qNumber, qConfirm };