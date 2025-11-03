import mongoose from 'mongoose';

const PollOptionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  }
}, { _id: true });

const PollQuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  options: {
    type: [PollOptionSchema],
    validate: {
      validator(options) {
        return Array.isArray(options) && options.length >= 2;
      },
      message: 'Each question must provide at least two options.'
    }
  }
}, { _id: true });

const PollSchema = new mongoose.Schema({
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
  questions: {
    type: [PollQuestionSchema],
    validate: {
      validator(questions) {
        return Array.isArray(questions) && questions.length >= 1;
      },
      message: 'A poll must contain at least one question.'
    }
  },
  isPublished: {
    type: Boolean,
    default: false
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
  collection: 'polls',
  minimize: false,
  versionKey: false
});

PollSchema.index({ event: 1, createdAt: -1 });

PollSchema.pre('save', function updateTimestamps(next) {
  this.updatedAt = new Date();
  next();
});

PollSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
  this.set({ updatedAt: new Date() });
  next();
});

PollSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default PollSchema;
