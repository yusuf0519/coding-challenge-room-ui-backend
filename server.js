const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const port = 3000;

// Cors configuration - Allows requests from localhost:3001 or commenting it to get all the requests
// const corsOptions = {
//   origin: "http://localhost:3001",
//   optionsSuccessStatus: 204,
//   methods: "GET, POST, PUT, DELETE",
// };

// Use cors middleware
app.use(cors());

// Use express.json() middleware to parse JSON bodies of requests
app.use(express.json());

// GET route - Allows to get all the items
// example: localhost:3000/buildings
app.get("/buildings", (req, res) => {
  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);
    const result = jsonData.items;

    res.status(200).json({
      items: result,
      total: jsonData.items.length,
    });
  });
});

app.post("/removeRoom", (req, res) => {
  const { id, buildingId } = req.body;
  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);

    const index = jsonData.items.findIndex(
      (item) => item.buildingId === +buildingId
    );

    if (index === -1) {
      res.status(404).send("Not Found");
      return;
    }
    const roomIndex = jsonData.items[index].rooms.findIndex(
      (item) => item.roomId === id
    );

    if (index === -1) {
      res.status(404).send("Not Found");
      return;
    }
    jsonData.items[index]?.rooms.splice(roomIndex, 1);

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(200).json(jsonData.items[index]);
    });
  });
});

app.post("/buildings", (req, res) => {
  const { temperature, id } = req.body;
  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);

    const index = jsonData.items.findIndex((item) => item.buildingId === +id);
    if (index === -1) {
      res.status(404).send("Not Found");
      return;
    }
    let allData = jsonData.items[index];
    allData.rooms.forEach((element) => {
      if (element.currentTemperature < temperature) {
        element.ifHeating = true;
        element.ifCooling = false;
      } else {
        element.ifHeating = false;
        element.ifCooling = true;
      }
    });
    jsonData.items[index] = {
      ...allData,
      requestedTemperature: +temperature,
    };

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(200).json(jsonData.items[index]);
    });
  });
});

app.post("/buildings/addRoom", (req, res) => {
  const { buildingId, room, roomId } = req.body;
  const { occupant, currentTemperature } = room;
  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);

    const index = jsonData.items.findIndex(
      (item) => item.buildingId === +buildingId
    );
    if (index === -1) {
      res.status(404).send("Not Found");
      return;
    }

    const roomIndex = jsonData.items[index].rooms.findIndex(
      (item) => item.roomId === roomId
    );

    const allData = jsonData.items[index]?.rooms?.[roomIndex];
    // let allData = jsonData.items[index];
    // allData.rooms.forEach((element) => {
    //   if (element.currentTemperature < temperature) {
    //     element.ifHeating = true;
    //     element.ifCooling = false;
    //   } else {
    //     element.ifHeating = false;
    //     element.ifCooling = true;
    //   }
    // });
    jsonData.items[index].rooms[roomIndex] = {
      ...allData,
      occupant,
      currentTemperature,
      ifCooling:
        +currentTemperature > jsonData.items[index]?.requestedTemperature,
      ifHeating:
        +currentTemperature < jsonData.items[index]?.requestedTemperature,
    };

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(200).json(jsonData.items[index]);
    });
  });
});

// POST route - Allows to add a new item
// example: localhost:3000/building/room
/*
  body: {
    "buildingName": "Tower 2",
    "requestedTemperature": 25,
    "rooms":[]
  }
*/
app.post("/building/room", (req, res) => {
  const { buildingId, room } = req.body;
  const { occupant, currentTemperature } = room;
  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);
    const index = jsonData.items.findIndex(
      (item) => item.buildingId === +buildingId
    );

    const maxId = jsonData.items[index]?.rooms.reduce(
      (max, item) => Math.max(max, item.roomId),
      0
    );

    const newItem = {
      roomId: maxId + 1,
      occupant,
      currentTemperature: +currentTemperature,
      ifCooling:
        +currentTemperature > jsonData.items[index]?.requestedTemperature,
      ifHeating:
        +currentTemperature < jsonData.items[index]?.requestedTemperature,
    };
    console.log(newItem);
    jsonData.items[index]?.rooms.push(newItem);

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(201).json(newItem);
    });
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
