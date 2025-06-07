/*
    If any async function returns a promise that was rejected due to any reason, then
    the catch() promise will handle that error value by calling the next() function with
    that error value, so we do not need to wrap all of our middleware function's code
    inside a try catch block
*/

function asyncHandler(asyncFn)
{
    return (req, res, next) => 
    {
        asyncFn(req, res, next).catch(error => next(error));
    };
}

module.exports = asyncHandler;