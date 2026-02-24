const mongoose = require('mongoose');

const HealthSystemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    fhirBaseUrl: {
        type: String,
        required: true
    },
    authorizeUrl: {
        type: String,
        required: true
    },
    tokenUrl: {
        type: String,
        required: true
    },
    city: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

HealthSystemSchema.index({ name: 'text' });

module.exports = mongoose.model('HealthSystem', HealthSystemSchema);
