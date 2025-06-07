const logoutForm = document.querySelector(".log-out-form");

logoutForm.addEventListener("submit", async event => 
{
    event.preventDefault();
    const logoutButton = document.querySelector(".log-out-button");
    logoutButton.textContent = "Logging out...";

    const formData = new FormData(event.target);
    const logoutRequest = {
        email: formData.get("email"),
        password: formData.get("password")
    };

    try
    {
        const response = await fetch("/logout-all-notoken", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(logoutRequest)
        });

        const json = await response.json();

        if(!response.ok)
            throw json;

        //Logged out from all devices from the server side
        //Now we need to delete our token if we have any on the client side as well
        localStorage.removeItem("token");

        window.location.href = "/login.html";

    }
    catch(error)
    {
        const errorMessage = error.error || "Could not log out from all devices";
        const errorElement = document.querySelector(".error-message");
        errorElement.textContent = errorMessage;
        errorElement.style.opacity = "1.0";

        setTimeout(() => 
        {
            errorElement.style.opacity = "0.0";

        }, 4000);
    }
    finally
    {
        logoutButton.textContent = "Logout";
    }
});
