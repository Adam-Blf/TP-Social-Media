import mongoose from 'mongoose';

const EventParticipantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['going', 'interested'],
    default: 'going'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const EventSettingsSchema = new mongoose.Schema({
  allowSharing: {
    type: Boolean,
    default: false
  },
  shoppingListEnabled: {
    type: Boolean,
    default: false
  },
  carpoolingEnabled: {
    type: Boolean,
    default: false
  },
  ticketingEnabled: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 150
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator(value) {
        return this.startDate <= value;
      },
      message: 'End date must be after the start date.'
    }
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  coverPhoto: {
    type: String,
    trim: true
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  organizers: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    validate: {
      validator(organizers) {
        return organizers.length > 0;
      },
      message: 'An event must have at least one organizer.'
    }
  },
  participants: {
    type: [EventParticipantSchema],
    default: () => []
  },
  settings: {
    type: EventSettingsSchema,
    default: () => ({})
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
  collection: 'events',
  minimize: false,
  versionKey: false
});

EventSchema.index({ name: 1, startDate: 1 });
EventSchema.index({ group: 1 });

EventSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
  this.set({ updatedAt: new Date() });
  next();
});

EventSchema.pre('save', function validateEvent(next) {
  this.updatedAt = new Date();

  this.participants = Array.isArray(this.participants) ? this.participants : [];

  const organizerIds = new Set(this.organizers.map((id) => id.toString()));

  if (!organizerIds.has(this.createdBy.toString())) {
    next(new Error('The creator must be part of the organizers list.'));
    return;
  }

  const participantIds = new Set();
  this.participants = this.participants.filter((participant) => {
    const id = participant.user.toString();
    if (participantIds.has(id)) {
      return false;
    }
    participantIds.add(id);
    return true;
  });

  next();
});

EventSchema.path('organizers').validate((organizers) => {
  const unique = new Set(organizers.map((id) => id.toString()));
  return unique.size === organizers.length;
}, 'Organizers must be unique.');

EventSchema.path('participants').validate((participants) => {
  const unique = new Set(participants.map((participant) => participant.user.toString()));
  return unique.size === participants.length;
}, 'Participants must be unique.');

EventSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default EventSchema;
