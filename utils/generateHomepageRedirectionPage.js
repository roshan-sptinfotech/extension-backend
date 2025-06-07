function generateHomepageRedirectionPage()
{
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Redirection Page | Email Read Receipts Extension</title>
    </head>
    <body>
    <script>
    window.location.href="${process.env.APPLICATION_URL}/user.html?page=1&activeNav=1"
    </script>
    </body>
    </html>
    `;
}

module.exports = generateHomepageRedirectionPage;