require("dotenv").config();
const path = require("path");
const fetch = require("node-fetch");
const {SOLA_SOLR_URL, SOLA_SOLR_CORE} = process.env;

(async () => {
  const file = path.resolve(process.argv[2]);
  console.log(`Searching ${SOLA_SOLR_URL + SOLA_SOLR_CORE}_* for ${file}`);

  const solr = await fetch(`${SOLA_SOLR_URL}admin/cores?wt=json`).then((res) => res.json());

  const result = await Promise.all(Object.keys(solr.status) // get the names of all loaded cores
    .filter((coreName) => coreName.indexOf(`${SOLA_SOLR_CORE}_`) === 0) // select all cores of the name
    .map((coreName) => `${SOLA_SOLR_URL + coreName}/lireq?&field=cl_ha&ms=false&file=${file}&accuracy=0&candidates=1000000&rows=10`)
    .map((uri) => fetch(uri).then((res) => res.json())));
  if (result.some((res) => res.Error)) {
    console.log(result);
  } else {
    const combinedResult = result
      .map((res) => res.response.docs)
      .reduce((all, each) => all.concat(each), [])
      .sort((a, b) => b.d - a.d)
      .slice(-5);

    console.log(JSON.stringify(combinedResult, null, 2));
  }
})();
