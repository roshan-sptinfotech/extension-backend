const mongoClient = require("../database/connection.js");

async function getHyperlinkPage(page, pageSize, emailId, session)
{
    const aggregationPipeline = [
        {
            $match: { emailId }
        },
        {
            $skip: (page - 1)*pageSize
        },
        {
            $limit: pageSize
        }
    ];

    const emailViews = await mongoClient.db("emailReadReceipt").collection("hyperlinks").aggregate(aggregationPipeline, { session }).toArray();

    return emailViews;
}

module.exports = getHyperlinkPage;