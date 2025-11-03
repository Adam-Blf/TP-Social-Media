import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MessageSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  replies: {
    type: [ReplySchema],
    default: () => []
  }
});

const DiscussionThreadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 150
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: {
    type: [MessageSchema],
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
  collection: 'discussion_threads',
  minimize: false,
  versionKey: false
});

DiscussionThreadSchema.pre('save', function validateLink(next) {
  const hasGroup = Boolean(this.group);
  const hasEvent = Boolean(this.event);

  if ((hasGroup && hasEvent) || (!hasGroup && !hasEvent)) {
    next(new Error('A discussion thread must be linked to exactly one group or one event.'));
    return;
  }

  this.updatedAt = new Date();
  next();
});

DiscussionThreadSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
  this.set({ updatedAt: new Date() });
  next();
});

DiscussionThreadSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default DiscussionThreadSchema;
