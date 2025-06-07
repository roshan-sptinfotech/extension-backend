//This is supposed to be used inside the <iframe> element's scripts
function checkExpiredToken(jsonResponse)
{
    if(jsonResponse.expired)
        localStorage.removeItem("token");

    return jsonResponse.expired ? true: false;
}