var csv = require("csv-parser");
var fs = require("fs");

async function loadCsv(){
        let results = new Promise(function (resolve, reject) {
            var results = [];
            fs.createReadStream("db/coursera-course-detail-data.csv", {encoding: 'UTF-8'})
              .pipe(csv({separator: ';' }))
              .on("data", (data) => {
                  if(data.tags == "None"){
                      data.Tags = [];
                  }else{
                    //console.log(data.Tags);
                    //data.Tags.replace("'[","");
                    let arr = data.tags.split(",");
                    let myfinalArray = [];
                    arr.forEach( (tag) => {
                        let string = tag.replace("[","").replace("]","");
                        let finalString = string.replace("'","").replace("'","");
                        let trimmedString = finalString.trim();
                        myfinalArray.push(trimmedString)
                    })
                    data.tags = myfinalArray;
                  }
                  if(data.price != "None"){
                    data.price = parseFloat(data.price) * 40
                  }else{
                      data.price = 0
                  }
                  if(data.level == "None"){
                    data.level = 'All Levels'
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
