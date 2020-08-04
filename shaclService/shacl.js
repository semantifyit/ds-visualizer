const got = require('got');

async function con_getDSByHash(hash, res) {
    try {
        // Url: 'http://localhost:8081/api/domainSpecification/hash/' + hash, //debug local
        const response = await got('https://semantify.it/api/domainSpecification/hash/' + hash, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8',
            }
        });
        let ds = JSON.parse(response.body)["content"];
        makeDSPretty(ds["@graph"][0]);
        res.status(200).send(ds);
    } catch (error) {
        res.status(400).send({"error": "could not find a Domain Specification with that Hash-Code."});
    }
}

// Removes sh:or with single values and puts the content in the parent node (prettier to read)
function makeDSPretty(ds) {
    let propertiesArray;
    if (ds["sh:targetClass"] !== undefined && Array.isArray(ds["sh:property"])) {
        propertiesArray = ds["sh:property"];
    } else if (ds["sh:class"] !== undefined && ds["sh:node"] !== undefined && Array.isArray(ds["sh:node"]["sh:property"])) {
        propertiesArray = ds["sh:node"]["sh:property"];
    }
    if (Array.isArray(propertiesArray)) {
        for (let i = 0; i < propertiesArray.length; i++) {
            // Recursive transform content first
            if (Array.isArray(propertiesArray[i]["sh:or"])) {
                for (let l = 0; l < propertiesArray[i]["sh:or"].length; l++) {
                    makeDSPretty(propertiesArray[i]["sh:or"][l]);
                }
            }
            // Transform this property
            if (Array.isArray(propertiesArray[i]["sh:or"]) && propertiesArray[i]["sh:or"].length === 1) {
                // Move to outer object
                let tempRange = JSON.parse(JSON.stringify(propertiesArray[i]["sh:or"][0]));
                let tempRangeKeys = Object.keys(tempRange);
                for (let k = 0; k < tempRangeKeys.length; k++) {
                    propertiesArray[i][tempRangeKeys[k]] = tempRange[tempRangeKeys[k]];
                }
                delete propertiesArray[i]["sh:or"];
            } else if (Array.isArray(propertiesArray[i]["sh:or"]) && propertiesArray[i]["sh:or"].length === 0) {
                // Remove empty object
                delete propertiesArray[i]["sh:or"];
            }
        }
    }
}

module.exports = {con_getDSByHash};