function generateRedirectionPage(url)
{
    return `<!DOCTYPE html>
    <html>
    <head>
    </head>
    <body>
    <script>
    window.location.replace("${url}");
    </script>
    </body>
    </html>`;
}

module.exports = generateRedirectionPage;