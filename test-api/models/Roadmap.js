const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoadmapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  guid: {
    type: String,
    unique: true,
  },
  components: {
    type: Array,
    default: [],
  }
},
{
  writeConcern: {
  w: 'majority',
  wtimeout: 3000
}});

module.exports = mongoose.model('Roadmap', RoadmapSchema);