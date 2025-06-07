function generatePasswordResetEmail(userId, randomString)
{
    //This randomString should already be encrypted by our encryption object before it is passed to this function
    const uriEncodedPasswordResetCode = encodeURIComponent(randomString);
    //This should be a string value
    const uriEncodedUserId = encodeURIComponent(userId);
    const emailHtmlBody = `
    <div style="font-family:Verdana, Geneva, Tahoma, sans-serif;">
    <a href="${process.env.APPLICATION_URL}/reset-password.html?userId=${uriEncodedUserId}&password=${uriEncodedPasswordResetCode}">Click here</a> to reset your password.
    </div>
    `;

    return emailHtmlBody;
}

module.exports = generatePasswordResetEmail;