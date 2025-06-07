async function fetchPage(page, token)
{
    const response = await fetch(`/user/links?page=${page}`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ token })
    });

    const json = await response.json();

    if(checkExpiredToken(json))
    {
        window.parent.location.href = "/token-expired.html";
    }

    if(accountNotActivated(json, document.querySelector(".email-items")))
    {
        return;
    }

    if(checkExpiredSubscription(json))
        return;

    if(!response.ok)
        return { error: json.error || "Could not fetch email data" };

    return json;
}


function convertTimeTo12Hour(date)
{
    let hours = date.getHours();
    const minutes = date.getMinutes();
    let postfix = "AM";

    if(hours >= 13)
    {
        postfix = "PM";
        hours -= 12;
    }
    
    else if(hours === 12)
    {
    	postfix = "PM";
    }
    
    else if(hours === 0)
    {
    	hours = "12";
    }

    return `${hours}:${minutes <= 9 ? `0${minutes}` : minutes} ${postfix}`;
}

function getStartingPage(currentPage)
{
    if(currentPage % 10 === 0)
        currentPage = currentPage - 1;
    

    currentPage = String(currentPage);
    currentPage = currentPage.slice(0, currentPage.length-1) + "1";

    return Number(currentPage);
    
}

function getLastPageOfCurrentSegment(currentPage)
{
    while(currentPage % 10 !== 0)
        currentPage++;

    return currentPage;
}

function createPaginationContent(totalEmails, pageSize, currentPage)
{
    const paginationDiv = document.querySelector(".pagination");
    const lastPageNumber = Math.ceil(totalEmails/pageSize);  
    const endingPage = Math.min(getLastPageOfCurrentSegment(currentPage), lastPageNumber);
    currentPage = String(currentPage);
    const startingPage = getStartingPage(currentPage);

    // console.log(startingPage, endingPage);

    if(startingPage !== 1)
    {
        const anchor = document.createElement("a");
        anchor.href = `/user.html?page=${startingPage - 1}&activeNav=2`;
        anchor.target = "_parent";
        paginationDiv.appendChild(anchor);
        anchor.innerHTML = `&laquo;`;
        anchor.addEventListener("click", event => sessionStorage.removeItem("main-frame-src"));
    }

    for(let i=startingPage; i<=endingPage; i++)
    {
        const anchor = document.createElement("a");
        anchor.href = `/user.html?page=${i}&activeNav=2`;
        anchor.target = "_parent";
        paginationDiv.appendChild(anchor);
        anchor.textContent = `${i}`;

        if(i == currentPage)
            anchor.className = "active";

        anchor.addEventListener("click", event => sessionStorage.removeItem("main-frame-src"));

    }

    if(endingPage !== lastPageNumber)
    {
        const anchor = document.createElement("a");
        anchor.href = `/user.html?page=${endingPage + 1}&activeNav=2`;
        anchor.target = "_parent";
        paginationDiv.appendChild(anchor);
        anchor.innerHTML = `&raquo;`;

        anchor.addEventListener("click", event => sessionStorage.removeItem("main-frame-src"));
    }
    

}

async function loadPage()
{
    const queryStartIndex = window.parent.location.href.lastIndexOf("?");
    const queryString = window.parent.location.href.slice(queryStartIndex);

    const pageQueryRegex = /page=(\d+)/;

    const matchArray = pageQueryRegex.exec(queryString);
    
    let page = 1;

    if(matchArray)
    {
        const pageValue = matchArray[1];
        page = Number(pageValue);
    }

    else if(!matchArray)
    {
        console.log("page query parameter not given")
    }

    const token = localStorage.getItem("token");

    if(!token)
        return;

    const responseData = await fetchPage(page, token); 

    if(!responseData)
        return;

    const totalEmails = responseData.totalEmails;
    const response = responseData.emails;

    if(responseData.error)
    {
        console.log("Could not fetch email data");
        return;
    }

    const emailItems = document.querySelector(".email-items");
    const mainElement = document.querySelector("main");
    const paginationDiv = document.querySelector(".pagination");

    emailItems.innerHTML = "";
    paginationDiv.innerHTML = "";
    
    const noDataMessageDiv = document.querySelector(".no-data-message");

    if(noDataMessageDiv)
    {
        mainElement.removeChild(noDataMessageDiv);
    }

    for(let i=0; i<response.length; i++)
    {
        
        const emailData = response[i];
        const sentOn = new Date(emailData.sentOn).toLocaleDateString() + ", " + convertTimeTo12Hour(new Date(emailData.sentOn));
        const subject = emailData.subject;
        const statusContent = emailData.status === 0 ? `<i class="fa-solid fa-link ui-icon"></i> No Links` : 
        `<i class="fa-solid fa-link ui-icon blue-icon"></i> contains ${emailData.status} link${emailData.status >= 2 ? "s": ""}`;


        let li = document.createElement("li");
        li.innerHTML = `
            <a href="/link-detail.html?emailId=${emailData._id}" class="email-item-link">
            <div class="email-item" data-emailid="${emailData._id}">
                    <table>
                        <tr>
                            <th>Recipients</th> <td data-recipients='${JSON.stringify(emailData.recipients)}'>${emailData.recipients.join(", ")}</td>
                        </tr>

                        <tr>
                            <th>Sent on</th> <td>${sentOn}</td>
                        </tr>

                        <tr>
                            <th>Links</th> <td>${statusContent}</td>
                        </tr>

                        <tr>
                            <th>Subject</th> <td>${subject}</td>
                        </tr>
                        
                        
                    </table>
                </div>
                </a>
        `;


        emailItems.appendChild(li);
    }

    if(response.length === 0)
    {
        const div = document.createElement("div");
        div.className = "no-data-message";
        div.textContent = "No Tracked Clicks Available";
        
        
        mainElement.appendChild(div);
    }


    createPaginationContent(totalEmails, 8, page);
    addShowMoreRecipientsOption();
    
    // setEmailItemClickListeners();
}

// function setEmailItemClickListeners()
// {
//     const emailItemDivs = document.querySelectorAll(".email-item");


//     function getDataEmailIdFromAncestor(node)
//     {
//         const emailId = node.getAttribute("data-emailid");

//         if(emailId)
//             return emailId;
        
//         else return getDataEmailIdFromAncestor(node.parentElement);
//     }

//     for(let emailItem of emailItemDivs)
//     {
//         emailItem.addEventListener("click", event => 
//         {
//             const emailId = getDataEmailIdFromAncestor(event.target);

//             console.log(emailId);
//         });
//     }
// }

function addShowMoreRecipientsOption()
{

    const emailItemLinks = document.querySelectorAll(".email-item-link");

    for(let link of emailItemLinks)
    {
        
        link.addEventListener("click", event => 
        {   
            
            if(event.target.classList.contains("show-more"))
                event.preventDefault();

            
        });
    }

    const tds = document.querySelectorAll("td[data-recipients]");
    
    for(let td of tds)
    {
        const recipients = JSON.parse(td.getAttribute("data-recipients"));
        

        //We don't need to perform any processing on those table cells which only store a single receiver's name
        if(recipients.length > 1)
        {
            //We can have two states, compressed and expanded
            td.setAttribute("data-state", "compressed");
            const showMoreSpan = document.createElement("span");
            showMoreSpan.textContent = " See more";
            showMoreSpan.className = "show-more";

            const textNode = document.createTextNode(recipients[0]);

            td.innerHTML = "";
            td.appendChild(textNode);
            td.appendChild(showMoreSpan);

            showMoreSpan.addEventListener("click", event => 
            {
                
                const showMoreSpan = event.target;
                const parentTd = showMoreSpan.parentElement;

                const parentState = parentTd.getAttribute("data-state");
                const recipients = JSON.parse(parentTd.getAttribute("data-recipients"));
                parentTd.innerHTML = "";

                if(parentState === "compressed")
                {
                    parentTd.setAttribute("data-state", "expanded");
                    showMoreSpan.textContent = " See less";
                    const textNode = document.createTextNode(recipients.join(", "));
                    parentTd.appendChild(textNode, showMoreSpan);
                    parentTd.appendChild(showMoreSpan);
                }

                else if(parentState === "expanded")
                {
                    parentTd.setAttribute("data-state", "compressed");
                    showMoreSpan.textContent = " See more";
                    const textNode = document.createTextNode(recipients[0]);
                    parentTd.appendChild(textNode, showMoreSpan);
                    parentTd.appendChild(showMoreSpan);

                }
            });
        }
    }
}

loadPage();
