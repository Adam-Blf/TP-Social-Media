import mongoose from 'mongoose';

const CarpoolOfferSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  departureLocation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  departureTime: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 1
  },
  maxDeviationMinutes: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'carpool_offers',
  minimize: false,
  versionKey: false
});

CarpoolOfferSchema.index({ event: 1, departureTime: 1 });

CarpoolOfferSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

CarpoolOfferSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
  this.set({ updatedAt: new Date() });
  next();
});

CarpoolOfferSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default CarpoolOfferSchema;
