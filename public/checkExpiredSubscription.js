function checkExpiredSubscription(jsonResponse)
{

    if(jsonResponse.subscriptionExpired)
    {
        const mainElement = document.querySelector("main");
        const div = document.createElement("div");
        div.className = "no-data-message";
        div.textContent = jsonResponse.error || "Your subscription has expired";
        
        mainElement.appendChild(div);
    }

    

    return jsonResponse.subcriptionExpired;
}