const mongoClient = require("../database/connection.js");

async function getEmailViewPage(page, pageSize, emailId, session)
{
    const aggregationPipeline = [
        {
            $match: { emailId }
        },
        {
            $sort: { viewTime: -1 }
        },
        {
            $skip: (page - 1)*pageSize
        },
        {
            $limit: pageSize
        }
    ];

    const emailViews = await mongoClient.db("emailReadReceipt").collection("emailViews").aggregate(aggregationPipeline, { session }).toArray();

    return emailViews;
}

module.exports = getEmailViewPage;