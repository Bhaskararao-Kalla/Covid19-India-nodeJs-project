const express = require("express");
const app = express();
module.exports = app;
app.use(express.json());

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

const responsiveStatesList = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = ` 
        SELECT * FROM state;
    `;

  const statesList = await db.all(getStatesQuery);
  response.send(statesList.map((eachState) => responsiveStatesList(eachState)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = ` 
        SELECT * FROM state WHERE state_id = ${stateId};
    `;

  const state = await db.get(getStateQuery);
  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  });
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = ` 
        INSERT INTO district 
        (district_name , state_id , cases , cured , active , deaths) 
        VALUES 
        ('${districtName}' , ${stateId} , ${cases} , ${cured} , ${active} , ${deaths});
  `;

  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = ` 
        SELECT * FROM district WHERE district_id = ${districtId};
    `;

  const district = await db.get(getDistrictDetailsQuery);
  response.send({
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  });
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = ` 
        DELETE FROM district WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const district = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = district;

  const updateQuery = ` 
        UPDATE district SET 
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases} ,
            cured = ${cured} ,
            active = ${active},
            deaths = ${deaths} 

        WHERE district_id = ${districtId};
  `;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  //   console.log(stateId);
  const getStatsQuery = ` 
        SELECT 
         SUM(cases) AS total_cases ,
         SUM(cured) AS total_cured , 
         SUM(active) AS total_active, 
         SUM(deaths) AS total_deaths
        FROM district 
        WHERE state_id = ${stateId};
    
    `;
  const list = await db.get(getStatsQuery);
  response.send({
    totalCases: list.total_cases,
    totalCured: list.total_cured,
    totalActive: list.total_active,
    totalDeaths: list.total_deaths,
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
        SELECT * FROM district LEFT JOIN state ON 
            district.state_id = state.state_id
        WHERE district_id = ${districtId};
    `;

  const state = await db.get(getStateQuery);
  response.send({
    stateName: state.state_name,
  });
});
