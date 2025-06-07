const signupForm = document.querySelector(".sign-up-form");

function generateRandomString(n)
{
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    let randomString = [];

    for(let i=1; i<=n; i++)
    {
        const randomPosition = Math.floor(Math.random()*characters.length);
        randomString.push(characters[randomPosition]);
    }

    return randomString.join("");
}

signupForm.addEventListener("submit", async event => 
{
    event.preventDefault();
    console.log("Here");

    const signupButton = document.querySelector(".sign-up-button");
    signupButton.textContent = "Signing up...";    

    const formData = new FormData(event.target);
    const randomUsername = generateRandomString(20);

    const user = {
        name: randomUsername,
        email: formData.get("email"),
        contact: formData.get("contact"),
        password: formData.get("password")
    };

    const signupRequest = { user };

    try
    {
        
        const response = await fetch("/create-user", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(signupRequest)
        });

        const json = await response.json();

        if(!response.ok)
            throw json;

        //If the user account was created successfully then we store the token in local storage of the user
        const token = json.token;
        localStorage.setItem("token", token);
        window.location.href = "/user.html";

    }
    catch(error)
    {
        const errorMessage = error.error || "Could not create an account";

        const errorMessageElement = document.querySelector(".error-message");
        errorMessageElement.textContent = errorMessage;

        errorMessageElement.style.opacity = "1.0";

        setTimeout(() => 
        {
            errorMessageElement.style.opacity = "0.0";
        }, 4000);
    }
    finally
    {
        signupButton.textContent = "Sign up";
    }

});