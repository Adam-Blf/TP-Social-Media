import mongoose from 'mongoose';

// Détermine si deux identifiants représentent le même utilisateur
const sameId = (a, b) => a && b && a.toString() === b.toString();

// Prépare les jointures communes pour la ressource événement
export const populateEvent = (query) => query
  .populate('organizers', 'firstName lastName email avatarUrl')
  .populate('participants.user', 'firstName lastName email avatarUrl')
  .populate('group', 'name type allowMemberEvents allowMemberPosts allowExternalSharing')
  .lean({ virtuals: true });

// Vérifie que tous les utilisateurs fournis existent bien en base
export const ensureUsersExist = async (User, ids) => {
  const unique = [...new Set((ids || []).map((value) => value && value.toString()))].filter(Boolean);
  if (!unique.length) {
    return true;
  }

  const count = await User.countDocuments({ _id: { $in: unique } });
  return count === unique.length;
};

// Construit l’objet settings final en héritant des préférences du groupe si nécessaire
export const buildEventSettings = (rawSettings, groupDoc) => {
  const overrides = rawSettings || {};
  const settings = {
    allowSharing: false,
    shoppingListEnabled: false,
    carpoolingEnabled: false,
    ticketingEnabled: false,
    ...overrides
  };

  if (groupDoc && groupDoc.type === 'public' && groupDoc.allowExternalSharing) {
    settings.allowSharing = overrides.allowSharing ?? true;
  }

  return settings;
};

// Ajoute automatiquement tous les membres du groupe comme participants "going"
export const mergeGroupMembersIntoParticipants = (groupDoc, currentParticipants = []) => {
  if (!groupDoc) {
    return currentParticipants;
  }

  const participantsMap = new Map(currentParticipants.map((participant) => [participant.user.toString(), participant]));

  groupDoc.members.forEach((member) => {
    const key = member.user.toString();
    if (!participantsMap.has(key)) {
      participantsMap.set(key, {
        user: member.user,
        status: 'going'
      });
    }
  });

  return [...participantsMap.values()];
};

// Uniformise la structure des participants et applique un statut par défaut
export const ensureParticipantStructure = (rawParticipants = []) => rawParticipants.map((participant) => ({
  user: participant.user,
  status: participant.status || 'going'
}));

// Vérifie l’existence d’un participant via son sous-document
export const ensureParticipantExists = async (Event, eventId, participantId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    return { event: null, participant: null };
  }

  const participant = event.participants.id(participantId);
  return { event, participant };
};

// Utilitaires pour savoir si l’utilisateur est organisateur ou participant
export const isEventOrganizer = (event, userId) => event.organizers.some((organizerId) => sameId(organizerId, userId));

export const isEventParticipant = (event, userId) => (
  isEventOrganizer(event, userId)
  || event.participants.some((participant) => sameId(participant.user, userId))
);

// Ajoute un participant après avoir validé son unicité
export const appendParticipant = (event, userId, status = 'going') => {
  const alreadyParticipant = event.participants.some((participant) => sameId(participant.user, userId));
  if (alreadyParticipant) {
    return false;
  }

  event.participants.push({
    user: new mongoose.Types.ObjectId(userId),
    status
  });

  return true;
};

export const sameObjectId = sameId;

export default {
  populateEvent,
  ensureUsersExist,
  buildEventSettings,
  mergeGroupMembersIntoParticipants,
  ensureParticipantStructure,
  ensureParticipantExists,
  isEventOrganizer,
  isEventParticipant,
  appendParticipant,
  sameObjectId
};
