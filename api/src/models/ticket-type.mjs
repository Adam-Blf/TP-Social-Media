import mongoose from 'mongoose';

const TicketTypeSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  collection: 'ticket_types',
  minimize: false,
  versionKey: false
});

TicketTypeSchema.index({ event: 1, name: 1 }, { unique: true });

TicketTypeSchema.pre('save', function updateTimestamps(next) {
  if (this.sold > this.quantity) {
    next(new Error('Sold quantity cannot exceed total quantity.'));
    return;
  }

  this.updatedAt = new Date();
  next();
});

TicketTypeSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
  const update = this.getUpdate();
  if (update && update.$inc && update.$inc.sold) {
    this.model.findOne(this.getQuery()).then((doc) => {
      if (doc && doc.sold + update.$inc.sold > doc.quantity) {
        next(new Error('Sold quantity cannot exceed total quantity.'));
      } else {
        this.set({ updatedAt: new Date() });
        next();
      }
    }).catch(next);
    return;
  }

  this.set({ updatedAt: new Date() });
  next();
});

TicketTypeSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default TicketTypeSchema;
