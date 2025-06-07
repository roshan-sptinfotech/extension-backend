function checkIfNotLoggedIn()
{
    if(!localStorage.getItem("token"))
        window.location.href = "/login.html";
}



function setActiveNavlinkListeners()
{
    const navDiv = document.querySelector(".nav");
    const anchors = navDiv.querySelectorAll("a");
    for(let i=0; i<anchors.length; i++)
    {

        if(anchors[i].classList.contains("logout-nav") || anchors[i].classList.contains("resend-activation-nav"))
            continue;

        anchors[i].addEventListener("click", event => 
        {
            

            for(let j=0; j<anchors.length; j++)
                anchors[j].classList.remove("active");

            event.target.classList.add("active");
            
            
            // We have deleted the currently active url for the current_page <iframe> element
            // so that we can start from the starting of the newly loaded page in this <iframe> element
            // when this user.js file is executed again and the setIframeContent() function is called
            // because the user.html file was reloaded.
            sessionStorage.removeItem("main-frame-src");


            const search = window.location.search.replace(/activeNav=\d+/, `activeNav=${i+1}`);
            window.location.search = search;
             
        });
    }
}

function setIframeContent()
{
    const navDiv = document.querySelector(".nav");
    const anchors = navDiv.querySelectorAll("a");
    const iframe = document.querySelector("[name=\"current_page\"]");


    let activeNav = 1;

    const search = window.location.search;
    const activeNavRegex = /activeNav=(\d+)/;

    const matchArray = activeNavRegex.exec(search);

    if(matchArray && !Number.isNaN(Number(matchArray[1])))
    {
        activeNav = Number(matchArray[1]);
    }

    for(let anchor of anchors)
    {
        anchor.classList.remove("active");
    }

    anchors[activeNav - 1].classList.add("active");

    if(sessionStorage.getItem("main-frame-src"))
    {
        iframe.src = sessionStorage.getItem("main-frame-src");
        return;
    }

    iframe.src = anchors[activeNav - 1].href;

}

function setQueryParameters()
{
    if(window.location.search.lastIndexOf("page") === -1 || window.location.search.lastIndexOf("activeNav") === -1)

    window.location.search = "?page=1&activeNav=1";
}

function setLogoutNavLink()
{
    const logoutLink = document.querySelector(".logout-nav");

    logoutLink.addEventListener("click", async event => 
    {
        event.preventDefault();
        
        
        const response = await fetch("/log-out", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ token: localStorage.getItem("token") })
        });

        const json = await response.json();

        if(checkExpiredToken(json))
        {
            window.location.href = "/token-expired.html";
        }

        if(!response.ok && response.status !== 404)
        {
            console.log(json.error || "Could not logout");
            return;
        }
        
        localStorage.removeItem("token");
        console.log(localStorage);

        window.location.href = "/login.html";
    });
}

function setResendAccountNavLink()
{
    const resendLink = document.querySelector(".resend-activation-nav");

    resendLink.addEventListener("click", async event => 
    {
        event.preventDefault();
        const link = event.target;

        link.innerHTML = `<i class="fa-solid fa-reply nav-icon"></i> Resending Mail...`;
        link.style.pointerEvents="none";

        try
        {
            const response = await fetch("/resend-activation-mail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: localStorage.getItem("token") })
            });

            const json = await response.json();

            if(!response.ok)
                throw json.error;

        }
        catch(error)
        {
            console.log(error || "Could not resent account activation link");
        }

        link.innerHTML = `<i class="fa-solid fa-reply nav-icon"></i> Resend Activation Mail`;
        link.style.pointerEvents="auto";
    });
}

checkIfNotLoggedIn();
setQueryParameters();
setActiveNavlinkListeners();
setLogoutNavLink();
setResendAccountNavLink();
setIframeContent();