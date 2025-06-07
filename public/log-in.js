function checkIfAlreadyLoggedIn()
{
    if(localStorage.getItem("token"))
        window.location.href = "/user.html?page=1&activeNav=1";
}

//If user is already logged in from this device then do not let them log in again on this device
//redirect them to the user page
checkIfAlreadyLoggedIn();

const loginForm = document.querySelector(".log-in-form");

loginForm.addEventListener("submit", async event => 
{
    event.preventDefault();
    const loginButton = document.querySelector(".log-in-button");
    loginButton.textContent = "Logging in...";

    const formData = new FormData(event.target);
    const loginRequest = {
        email: formData.get("email"),
        password: formData.get("password")
    };

    try
    {
        const response = await fetch("/log-in", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(loginRequest)
        });

        const json = await response.json();

        if(!response.ok)
            throw json;

        //Successfully logged in
        const token = json.token;

        localStorage.setItem("token", token);

        window.location.href = "/user.html?page=1&activeNav=1";
    }
    catch(error)
    {
        const errorMessage = error.error || "Could not login";
        showError(errorMessage);
    }
    finally
    {
        loginButton.textContent = "Login";
    }
});

function showError(message)
{
    const errorMessageElement = document.querySelector(".error-message");
    errorMessageElement.textContent = message;
    errorMessageElement.style.color = "#ed4337";
    errorMessageElement.style.opacity = "1.0";

    setTimeout(() => 
    {
        errorMessageElement.style.opacity = "0.0";

    }, 4000);
}

function showMessage(message)
{
    const errorMessageElement = document.querySelector(".error-message");
    errorMessageElement.textContent = message;
    errorMessageElement.style.color = "dodgerBlue";
    errorMessageElement.style.opacity = "1.0";

    setTimeout(() => 
    {
        errorMessageElement.style.opacity = "0.0";

    }, 4000);
}

function setForgotPasswordListener()
{
    const forgotPassword = document.querySelector(".forgot-password");
    forgotPassword.addEventListener("click", async event => 
    {
        event.preventDefault();

        const form = document.querySelector("form");
        const formData = new FormData(form);
        const email = formData.get("email");

        if(!email)
        {
            showError("Please provide an email");

            return;
        }

        try
        {
            const response = await fetch("/forgot-password-begin?email=" + email, {
                method: "POST"
            });

            const json = await response.json();

            if(!response.ok)
                throw json.error;

            showMessage(json.message);
        }
        catch(error)
        {
            showError(error || "Could not initiate password reset request");
        }
        
    });
}

setForgotPasswordListener();