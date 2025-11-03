import mongoose from 'mongoose';

const PollResponseAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, { _id: false });

const PollResponseSchema = new mongoose.Schema({
  poll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: {
    type: [PollResponseAnswerSchema],
    validate: {
      validator(answers) {
        return Array.isArray(answers) && answers.length >= 1;
      },
      message: 'A poll response must contain at least one answer.'
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'poll_responses',
  minimize: false,
  versionKey: false
});

PollResponseSchema.index({ poll: 1, respondent: 1 }, { unique: true });

PollResponseSchema.pre('validate', async function ensureAnswersValid(next) {
  try {
    const PollModel = this.model('Poll');
    const poll = await PollModel.findById(this.poll).lean();

    if (!poll) {
      next(new Error('Associated poll not found.'));
      return;
    }

    const questionMap = new Map();
    poll.questions.forEach((question) => {
      questionMap.set(String(question._id), question.options.map((option) => String(option._id)));
    });

    for (const answer of this.answers) {
      const options = questionMap.get(String(answer.questionId));
      if (!options || !options.includes(String(answer.optionId))) {
        next(new Error('Invalid question or option reference.'));
        return;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

PollResponseSchema.set('toJSON', {
  transform: (doc, ret) => {
    const updated = ret;
    updated.id = updated._id;
    delete updated._id;
    return updated;
  }
});

export default PollResponseSchema;
