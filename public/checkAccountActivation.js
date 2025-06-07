//Here emailItems is an <ol> element
function accountNotActivated(jsonResponse, emailItems)
{
    if(jsonResponse.verified === false)
    {
        const div = document.createElement("div");
        div.className = "no-data-message";
        div.textContent = "Your account is not activated yet, Please activate it first";
        emailItems.appendChild(div);
        return true;
    }

    else return false;
}