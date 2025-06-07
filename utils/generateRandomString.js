function generateRandomString(n)
{
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_+-=";
    let randomString = [];

    for(let i=1; i<=n; i++)
    {
        const randomPosition = Math.floor(Math.random()*characters.length);
        randomString.push(characters[randomPosition]);
    }

    return randomString.join("");
}

module.exports = generateRandomString;