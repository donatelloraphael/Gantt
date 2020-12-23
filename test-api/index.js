const express = require("express");
const bodyParser = require("body-parser");
const consola = require("consola");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();

const Roadmap = require("./models/Roadmap.js");

const corsOptions = {
  origin: "*",
  methods: "GET,POST,DELETE,PUT",
  preflightContinue: false,
  optionsSuccessStatus: 200
};

const app = express();

app.use(cors(corsOptions));
app.use(bodyParser.json({limit: '50mb'})); // set POST request max size
app.use(bodyParser.urlencoded({extended:true}));

// Alternatives for deprecated functions
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

async function startServer() {

	// Connect to MongoDB
	mongoose.connect("mongodb://127.0.0.1:27017/gantt", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() =>  {
    consola.ready({
      message: "Mongoose connection succesful on http://127.0.0.1/gantt:27017",
      badge: true
    });
  }).catch(err => console.error(err));

  // Start API
	app.listen(9000, "127.0.0.1");

	consola.ready({
    message: "API server listening on http://127.0.0.1:9000",
    badge: true
  });

  roadmaps();
}

startServer();

async function roadmaps() {

  // Get all Roadmaps
  app.get("/api/roadmaps", (req, res) => {
    Roadmap.find({})
    .then(results => {
      res.send(results);
    }).catch(err => console.log(err));
  });


  // Create a new Roadmap
  app.post("/api/roadmaps", (req, res) => {
    const newRoadmap = {
      title: req.body.title,
      description: req.body.description,
      guid: uuidv4(),
    };

    Roadmap.create(newRoadmap)
    .then(() => res.send(newRoadmap.guid))
    .catch(err => console.log(err));
  });


  // Get a Roadmap
  app.get("/api/roadmaps/:roadmapGuid", (req, res) => {
    Roadmap.findOne({guid: req.params.roadmapGuid})
    .then((result) => res.send(result))
    .catch(err => console.log(err));
  });


  // Add an action to a Roadmap
  app.post("/api/roadmaps/:roadmapGuid/Actions", (req, res) => {
    req.body.guid = uuidv4();
    if (!req.body.parentGuid) {
      req.body.parentGuid = "00000000-0000-0000-0000-000000000000";
    }
    Roadmap.updateOne({guid: req.params.roadmapGuid}, { $push: { components: req.body }})
    .then(() => res.send(req.body.guid))
    .catch(err => console.log(err));
  });


  // Add a Section to a Roadmap
  app.post("/api/roadmaps/:roadmapGuid/Sections", (req, res) => {
    req.body.guid = uuidv4();
    if (!req.body.parentGuid) {
      req.body.parentGuid = "00000000-0000-0000-0000-000000000000";
    }
    Roadmap.updateOne({guid: req.params.roadmapGuid}, { $push: { components: req.body }})
    .then(() => res.send(req.body.guid))
    .catch(err => console.log(err));
  });


  // Add a Phase to a Roadmap
  app.post("/api/roadmaps/:roadmapGuid/Phases", (req, res) => {
    req.body.guid = uuidv4();
    if (!req.body.parentGuid) {
      req.body.parentGuid = "00000000-0000-0000-0000-000000000000";
    }
    Roadmap.updateOne({guid: req.params.roadmapGuid}, { $push: { components: req.body }})
    .then(() => res.send(req.body.guid))
    .catch(err => console.log(err));
  });


  // Update components
  app.put("/api/roadmaps/:roadmapGuid/update", (req, res) => {
    if (!req.body.parentGuid) {
      req.body.parentGuid = "00000000-0000-0000-0000-000000000000";
    }
    Roadmap.updateOne({guid: req.params.roadmapGuid, "components.guid": req.body.guid}, { $set: { "components.$": req.body }})
    .then(() => res.send(req.body.guid))
    .catch(err => console.log(err));
  });


  // Delete components
  app.delete("/api/roadmaps/:roadmapGuid/delete", (req, res) => {
    Roadmap.updateOne({guid: req.params.roadmapGuid}, { $pull: { components: { guid: req.body.guid }}})
    .then(() => res.send(req.body.guid))
    .catch(err => console.log(err));
  });


  // Delete Roadmap
  app.delete("/api/roadmaps/delete", (req, res) => {
    Roadmap.deleteOne({ guid: req.body.guid })
    .then(() => res.send(req.body.guid))
    .catch(err => console.log(err));
  });
}