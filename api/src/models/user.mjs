import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /.+@.+\..+/
  },
  password: {
    type: String,
    minlength: 8
  },
  avatarUrl: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 280
  },
  city: {
    type: String,
    trim: true
  },
  languages: [
    {
      type: String,
      trim: true
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'users',
  minimize: false,
  versionKey: false
});

UserSchema.index({ email: 1 }, { unique: true });

UserSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

UserSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
  this.set({ updatedAt: new Date() });
  next();
});

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    delete updated.password;

    return updated;
  }
});

export default UserSchema;
