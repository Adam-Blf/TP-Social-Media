import mongoose from 'mongoose';

const GroupMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  icon: {
    type: String,
    trim: true
  },
  coverPhoto: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'public'
  },
  allowMemberPosts: {
    type: Boolean,
    default: true
  },
  allowMemberEvents: {
    type: Boolean,
    default: true
  },
  allowExternalSharing: {
    type: Boolean,
    default: false
  },
  members: {
    type: [GroupMemberSchema],
    default: () => [],
    validate: {
      validator(members) {
        return members.length > 0;
      },
      message: 'A group must have at least one member.'
    }
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
  collection: 'groups',
  minimize: false,
  versionKey: false
});

GroupSchema.index({ 'members.user': 1 });
GroupSchema.index({ name: 1 }, { unique: false });

GroupSchema.pre('save', function ensureAdmin(next) {
  this.members = Array.isArray(this.members) ? this.members : [];

  const hasAdmin = this.members && this.members.some((member) => member.role === 'admin');

  if (!hasAdmin) {
    next(new Error('A group must have at least one administrator.'));
    return;
  }

  this.updatedAt = new Date();
  next();
});

GroupSchema.pre('findOneAndUpdate', function updateTimestamp(next) {
  this.set({ updatedAt: new Date() });
  next();
});

GroupSchema.path('members').validate((members) => {
  const unique = new Set(members.map((member) => member.user.toString()));
  return unique.size === members.length;
}, 'Members must be unique.');

GroupSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default GroupSchema;
