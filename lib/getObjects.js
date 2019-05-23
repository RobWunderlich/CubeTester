function getObjects(app) {
    return app.getObjects(
        {"qTypes": ["sheet"]}

    ).then(function (data) {
        return data;
    })
    .catch(function (error){
        console.log(error);
    });
}
module.exports = getObjects;