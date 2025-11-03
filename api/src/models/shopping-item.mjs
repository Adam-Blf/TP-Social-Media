import mongoose from 'mongoose';

const ShoppingItemSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  contributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  quantity: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  arrivalTime: {
    type: String,
    trim: true
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
  collection: 'shopping_items',
  minimize: false,
  versionKey: false
});

ShoppingItemSchema.index({ event: 1, name: 1 }, { unique: true });

ShoppingItemSchema.pre('save', function normalizeName(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  this.updatedAt = new Date();
  next();
});

ShoppingItemSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
  this.set({ updatedAt: new Date() });
  next();
});

ShoppingItemSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default ShoppingItemSchema;
