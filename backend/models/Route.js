const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  route_code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['jeepney', 'modern_jeep', 'bus'],
    index: true
  },
  origin: {
    type: String,
    required: true,
    index: true
  },
  destination: {
    type: String,
    required: true,
    index: true
  },
  via: [{
    type: String
  }],
  route_coordinates: {
    type: Object,
    default: {}
  },
  notes: {
    type: String,
    default: ''
  },
  last_verified: {
    type: Date,
    default: Date.now
  },
  // Additional fields for enhanced search
  searchable_origin: {
    type: String,
    lowercase: true,
    index: true
  },
  searchable_destination: {
    type: String,
    lowercase: true,
    index: true
  },
  // For bus routes
  service: String,
  route_name: String,
  fare: String,
  frequency: String
}, {
  timestamps: true
});

// Pre-save middleware to create searchable fields
routeSchema.pre('save', function(next) {
  this.searchable_origin = this.origin.toLowerCase();
  this.searchable_destination = this.destination.toLowerCase();
  next();
});

// Index for text search
routeSchema.index({
  searchable_origin: 'text',
  searchable_destination: 'text',
  notes: 'text'
});

// Static method to find routes by origin and destination
routeSchema.statics.findRoutes = function(origin, destination) {
  const searchOrigin = origin.toLowerCase();
  const searchDestination = destination.toLowerCase();
  
  return this.find({
    $or: [
      {
        searchable_origin: { $regex: searchOrigin, $options: 'i' },
        searchable_destination: { $regex: searchDestination, $options: 'i' }
      },
      {
        searchable_origin: { $regex: searchDestination, $options: 'i' },
        searchable_destination: { $regex: searchOrigin, $options: 'i' }
      }
    ]
  }).sort({ type: 1, route_code: 1 });
};

// Static method to find routes by code
routeSchema.statics.findByCode = function(code) {
  return this.findOne({ route_code: code.toUpperCase() });
};

// Static method to get all routes of a specific type
routeSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ route_code: 1 });
};

module.exports = mongoose.model('Route', routeSchema);
