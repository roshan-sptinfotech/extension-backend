function createVerificationMailBody(userId, randomString)
{
    const uriEncodedPassword = encodeURIComponent(randomString);
    const uriEncodedUserId = encodeURIComponent(userId);
    const emailHtmlBody = `
    <div style="font-family:Verdana, Geneva, Tahoma, sans-serif;">
    Welcome to ${process.env.APPLICATION_NAME}. As a new user, you have been granted a trial period of ${process.env.TRIAL_DURATION_DAYS} day${process.env.TRIAL_DURATION_DAYS >= 2? "s" : ""}.<br>
    <a href="${process.env.APPLICATION_URL}/verify-account?password=${uriEncodedPassword}&userId=${uriEncodedUserId}">
    Click here
    </a> to verify your account
    </div>
    `;

    return emailHtmlBody;
}

module.exports = createVerificationMailBody;