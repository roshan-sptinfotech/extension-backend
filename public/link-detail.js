function setInitialQueryParameters()
{
    const queryString = window.location.search;
    const pageQueryRegex = /page=\d+/;
    let matchArray = pageQueryRegex.exec(queryString);

    if(!matchArray)
    {
        window.location.search += "&page=1";
    }

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

async function loadPage()
{
    const pageQueryRegex = /page=(\d+)/;
    let matchArray = pageQueryRegex.exec(window.location.search);

    let page = 1;

    if(matchArray)
        page = Number(matchArray[1]);

    const emailIdRegex = /emailId=([a-zA-Z0-9]+)/;
    matchArray = emailIdRegex.exec(window.location.search);
    const emailId = matchArray[1];


    const response = await fetch(`/link-clicks/${emailId}?page=${page}`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ token: localStorage.getItem("token") })
    });

    let json = await response.json();

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
    {
        console.log("Could not fetch link click data");
        return;
    }

    const emailDocument = json.emailDocument;
    const recipients = json.recipients.join(", ");
    const sentOn = new Date(emailDocument.createdOn).toLocaleDateString() + ", " + convertTimeTo12Hour(new Date(emailDocument.createdOn));
    const statusContent = json.status === 0 ? `<i class="fa-solid fa-link ui-icon"></i> No Links` : 
        `<i class="fa-solid fa-link ui-icon blue-icon"></i> contains ${json.status} link${json.status >= 2 ? "s": ""}`;

    const subject = emailDocument.subject;

    const emailItems = document.querySelector(".email-items");

    emailItems.innerHTML = "";

    let li = `
    <div class="email-item">
        <table>
            <tr>
                <th>Recipients</th> <td data-recipients='${JSON.stringify(json.recipients)}'>${recipients}</td>
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
    </div>`; 


    const firstLiElement = document.createElement("li");
    firstLiElement.innerHTML = li;
    emailItems.appendChild(firstLiElement);

    json.hyperlinks.sort((link1, link2) => link1.position - link2.position);
    loadHyperlinks(json.hyperlinks);
    createPaginationContent(json.status, 8, page);
    addShowMoreRecipientsOption();
}



function loadHyperlinks(hyperlinks)
{
    //This is an <ol> element and we must not remove its first child element
    const emailItems = document.querySelector(".email-items");

    for(let hyperlink of hyperlinks)
    {
        const li = document.createElement("li");
        let actualURL = /actualURL=([^]+)/.exec(hyperlink.href)[1];
        actualURL = decodeURIComponent(actualURL);

        const clickContent = hyperlink.clickCount === 0 ? 
        `<i class="fa-solid fa-arrow-pointer ui-icon"></i> No clicks yet` : 
        `<i class="fa-solid fa-arrow-pointer ui-icon blue-icon"></i> Clicked ${hyperlink.clickCount} time${hyperlink.clickCount >= 2 ? "s" : ""}`; 

        li.innerHTML = `
            <div class="email-item">
                <table>
                    <tr>
                        <th>Link Position</th> <td>${hyperlink.position}</td>
                    </tr>

                    <tr>
                        <th>URL</th> <td>${actualURL}</td>
                    </tr>

                    <tr>
                        <th>Click Count</th> <td>${clickContent}</td>
                    </tr>
                </table>
            </div>
        `;

        emailItems.appendChild(li);
    }


    if(hyperlinks.length === 0)
    {
        const div = document.createElement("div");
        div.className = "no-data-message";
        div.textContent = "No Links in this mail";

        emailItems.appendChild(div);
    }
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
    const onesPlace = currentPage % 10;
    const result = (10 - onesPlace) + onesPlace;
    return result;
}

function getLastPageOfCurrentSegment(currentPage)
{
    while(currentPage % 10 !== 0)
        currentPage++;

    return currentPage;
}

function createPaginationContent(totalViews, pageSize, currentPage)
{
    const paginationDiv = document.querySelector(".pagination");
    const lastPageNumber = Math.ceil(totalViews / pageSize);  
    const endingPage = Math.min(getLastPageOfCurrentSegment(currentPage), lastPageNumber);
    currentPage = String(currentPage);
    const startingPage = getStartingPage(currentPage);

    // console.log(startingPage, endingPage);

    if(startingPage !== 1)
    {
        const emailIdQueryRegex = /emailId=([a-zA-Z0-9]+)/;
        const matchArray = emailIdQueryRegex.exec(window.location.search);
        const emailIdQuery = matchArray[1];
    
        const anchor = document.createElement("a");
        anchor.href = `/link-detail.html?emailId=${emailIdQuery}&page=${startingPage - 1}`;
        paginationDiv.appendChild(anchor);
        anchor.innerHTML = `&laquo;`;
    }

    for(let i=startingPage; i<=endingPage; i++)
    {
        const anchor = document.createElement("a");
        const emailIdQueryRegex = /emailId=([a-zA-Z0-9]+)/;
        const matchArray = emailIdQueryRegex.exec(window.location.search);
        const emailIdQuery = matchArray[1];

        anchor.href = `/link-detail.html?emailId=${emailIdQuery}&page=${i}`;
        
        paginationDiv.appendChild(anchor);
        anchor.textContent = `${i}`;

        if(i == currentPage)
            anchor.className = "active";

    }

    if(endingPage !== lastPageNumber)
    {
        const emailIdQueryRegex = /emailId=([a-zA-Z0-9]+)/;
        const matchArray = emailIdQueryRegex.exec(window.location.search);
        const emailIdQuery = matchArray[1];
        
        const anchor = document.createElement("a");
        anchor.href = `/link-detail.html?emailId=${emailIdQuery}&page=${endingPage + 1}`;
        paginationDiv.appendChild(anchor);
        anchor.innerHTML = `&laquo;`;
    }
    

}

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

setInitialQueryParameters();
loadPage();
sessionStorage.setItem("main-frame-src", window.location.href);
