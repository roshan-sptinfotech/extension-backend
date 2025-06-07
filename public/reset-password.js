const passwordResetForm = document.querySelector(".password-reset-form");

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

function showMessage(message, callback = () => {})
{
    const errorMessageElement = document.querySelector(".error-message");
    errorMessageElement.textContent = message;
    errorMessageElement.style.color = "dodgerBlue";
    errorMessageElement.style.opacity = "1.0";

    setTimeout(() => 
    {
        errorMessageElement.style.opacity = "0.0";
        callback();

    }, 4000);
}

passwordResetForm.addEventListener("submit", async event => 
{
    event.preventDefault();
    const formData = new FormData(event.target);
    const newPassword = formData.get("password");
    const userIdQueryRegex = /userId=([a-zA-Z0-9]+)/;
    const passwordQueryRegex = /password=([^]+)/;

    const currentQueryString = window.location.search;
    
    const userIdMatch = userIdQueryRegex.exec(currentQueryString);
    const passwordMatch = passwordQueryRegex.exec(currentQueryString);

    if(!userIdMatch || !passwordMatch)
    {
        showError("The required query parameters were not found");
        return;
    }

    const userId = userIdMatch[1];
    const password = passwordMatch[1];

    console.log(userId, password);
    
    try
    {
        const response = await fetch(`/forgot-password-end?userId=${userId}&password=${password}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: newPassword })
        });

        const json = await response.json();

        if(!response.ok)
            throw json.error;

        showMessage("Your password was reset. Redirecting to the login page", () => 
        {
            window.location.href = "/login.html";
        });
    }
    catch(error)
    {
        showError(error || "Could not reset your password");
    }
});