const useragent = require("express-useragent");

//This is just a test function, it will be written in a more dynamic manner soon
function detectUserAgent(userAgentHeader)
{
    const agent = useragent.parse(userAgentHeader);

    const keys = Object.keys(agent).filter(element => element.startsWith("is"));
    const deviceTypes = [];

    for(let i=0; i<keys.length; i++)
    {
        const key = keys[i];

        if(key.toLowerCase().includes("authoritative"))
            continue;

        if(agent[key])
            deviceTypes.push(key.replace("is", ""));
    }

    let message = deviceTypes.slice(0, deviceTypes.length - 1).join(", ");

    if(deviceTypes.length >= 2)
        message += ` and ${deviceTypes[deviceTypes.length - 1]}`;

    if(deviceTypes.length >= 1)
        return message;

    return "Unknown Device";
}

module.exports = detectUserAgent;