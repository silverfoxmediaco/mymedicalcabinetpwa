const mongoose = require('mongoose');

// Deletes waiting to be sent to Foundry (docs/foundry-bridge.md §3).
// Keys only, no member data.
const FoundryDeleteQueueSchema = new mongoose.Schema({
    objectType: {
        type: String,
        required: true
    },
    primaryKey: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    lastError: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

FoundryDeleteQueueSchema.index({ createdAt: 1 });

module.exports = mongoose.model('FoundryDeleteQueue', FoundryDeleteQueueSchema);
