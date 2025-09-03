const mongoose = require('mongoose');

const routeEmbeddingSchema = new mongoose.Schema({
  route_code: {
    type: String,
    required: true,
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
  type: {
    type: String,
    enum: ['jeepney', 'modern_jeep', 'bus', 'taxi', 'habal_habal'],
    default: 'jeepney'
  },
  fare: {
    type: Number,
    min: 0
  },
  notes: String,
  origin_aliases: [String],
  destination_aliases: [String],
  embedding: {
    type: [Number],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length === 512; // Universal Sentence Encoder outputs 512-dimensional vectors
      },
      message: 'Embedding must be 512-dimensional'
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
routeEmbeddingSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Text search index for fallback search
routeEmbeddingSchema.index({
  route_code: 'text',
  origin: 'text',
  destination: 'text',
  notes: 'text'
});

// Compound indexes for efficient queries
routeEmbeddingSchema.index({ origin: 1, destination: 1 });
routeEmbeddingSchema.index({ type: 1, origin: 1 });

const RouteEmbedding = mongoose.model('RouteEmbedding', routeEmbeddingSchema);

module.exports = RouteEmbedding;
