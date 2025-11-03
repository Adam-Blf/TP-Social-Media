import mongoose from 'mongoose';

const PhotoCommentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PhotoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 200
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  comments: {
    type: [PhotoCommentSchema],
    default: () => []
  }
});

const AlbumSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 150
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  photos: {
    type: [PhotoSchema],
    default: () => []
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
  collection: 'albums',
  minimize: false,
  versionKey: false
});

AlbumSchema.pre('save', function updateTimestamps(next) {
  this.updatedAt = new Date();
  next();
});

AlbumSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
  this.set({ updatedAt: new Date() });
  next();
});

AlbumSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default AlbumSchema;
