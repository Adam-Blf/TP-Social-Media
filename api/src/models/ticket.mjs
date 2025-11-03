import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  street: {
    type: String,
    trim: true,
    maxlength: 150
  },
  postalCode: {
    type: String,
    trim: true,
    maxlength: 20
  },
  city: {
    type: String,
    trim: true,
    maxlength: 100
  },
  country: {
    type: String,
    trim: true,
    maxlength: 100
  }
}, { _id: false });

const TicketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  ticketType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketType',
    required: true
  },
  attendee: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /.+@.+\..+/
    },
    address: AddressSchema
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  externalBuyer: {
    type: Boolean,
    default: true
  }
}, {
  collection: 'tickets',
  minimize: false,
  versionKey: false
});

TicketSchema.index({ event: 1, 'attendee.email': 1 }, { unique: true });

TicketSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default TicketSchema;
