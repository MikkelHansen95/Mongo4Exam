var csv = require("csv-parser");
var fs = require("fs");

async function loadCsv(){
        let results = new Promise(function (resolve, reject) {
            var results = [];
            fs.createReadStream("db/coursera-course-detail-data.csv", {encoding: 'UTF-8'})
              .pipe(csv({separator: ';' }))
              .on("data", (data) => {
                  if(data.Tags == "None"){
                      data.Tags = [];
                  }else{
                    //console.log(data.Tags);
                    //data.Tags.replace("'[","");
                    let arr = data.Tags.split(",");
                    let myfinalArray = [];
                    arr.forEach( (tag) => {
                        let string = tag.replace("[","").replace("]","");
                        let finalString = string.replace("'","").replace("'","");
                        let trimmedString = finalString.trim();
                        myfinalArray.push(trimmedString)
                    })
                    data.Tags = myfinalArray;
                  }
                  if(data.Rating != "None"){
                    data.Rating = parseFloat(data.Rating)
                  }else{
                      data.Rating = null;
                  }
                  //data._id = parseFloat(data._id)
                  //console.log(data)
                  //console.log(data);
                  results.push(data)
              }) 
              .on("end", () => {
                resolve(results);
              });
          });
          return await results;
}


module.exports = {
    loadCsv: loadCsv
};
