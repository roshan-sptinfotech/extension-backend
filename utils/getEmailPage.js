/* 
db.emails.aggregate(
[ 
    { 
        $match: { owner: ObjectId('67448ace5f8b6a0b927254a2')  }  
    }, 
    
    { $sort: { createdOn: -1  }  }, 
    { $skip: (1-1)*8  }, 
    { $limit: 8  }  
]);
*/

const mongoClient = require("../database/connection");

async function getEmailPage(owner, pageNumber, pageSize, session)
{
    const aggregationPipeline = [
        {
            $match: { owner, sent: true }
        },
        { 
            $sort: { createdOn: -1 } 
        },
        {
            $skip: (pageNumber - 1) * pageSize
        },
        {
            $limit: pageSize
        }
    ];
    const emails = await mongoClient.db("emailReadReceipt").collection("emails").aggregate(aggregationPipeline, { session }).toArray();
    return emails;
}

module.exports = getEmailPage;