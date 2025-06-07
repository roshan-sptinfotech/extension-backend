function delay(millis)
{
    return new Promise((resolve, reject) => 
    {
        setTimeout(() => resolve(millis), millis);
    });
}

class MessageBox
{
    constructor()
    {
        this.element = document.createElement("div");
        this.element.style.position = "fixed";
        this.element.style.width = "100vw";
        this.element.style.height = "1rem";
        this.element.style.top = "0px";
        this.element.style.left = "0px";
        this.element.style.backgroundColor = "dodgerBlue";
        this.element.style.color = "white";
        this.element.style.fontFamily = "Verdana, Geneva, Tahoma, sans-serif";
        this.element.style.padding = "1rem 2rem";
        this.element.style.opacity = "0.0";
        this.element.style.display = "none";
        this.element.style.zIndex = "10";
        this.element.style.fontSize = "1rem";
        this.element.style.animationDelay = "3s";
        this.element.style.animationDuration = "1s";
        this.element.style.animationFillMode = "both";
        
        

        //Added to the page
        document.body.appendChild(this.element);
        // console.log("MessageBox object was created");
        
    }


    async showMessage(text)
    {
        this.element.textContent = text;
        this.element.style.display = "block";
        this.element.style.opacity = "1.0";
        this.element.style.backgroundColor = "dodgerBlue";
        this.element.style.color = "white";

        this.element.classList.remove("animate");
        await delay(10);

        return new Promise((resolve, reject) => 
        {
            window.requestAnimationFrame(() => 
            {
                this.element.classList.add("animate");
                resolve("animate");
            });
        });
        
    }

    async showError(text)
    {
        this.element.textContent = text;
        this.element.style.display = "block";
        this.element.style.opacity = "1.0";
        this.element.style.backgroundColor = "#ff7f7f";
        this.element.style.color = "white";

        this.element.classList.remove("animate");
        await delay(10);

        return new Promise((resolve, reject) => 
        {
            window.requestAnimationFrame(() => 
            {
                this.element.classList.add("animate");
                resolve("animate");
            });
        });
        
        
    }
}


const messageBox = new MessageBox();