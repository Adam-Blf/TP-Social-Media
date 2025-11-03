import UserSchema from './user.mjs';
import GroupSchema from './group.mjs';
import EventSchema from './event.mjs';
import DiscussionThreadSchema from './discussion-thread.mjs';
import AlbumSchema from './album.mjs';
import PollSchema from './poll.mjs';
import PollResponseSchema from './poll-response.mjs';
import TicketTypeSchema from './ticket-type.mjs';
import TicketSchema from './ticket.mjs';
import ShoppingItemSchema from './shopping-item.mjs';
import CarpoolOfferSchema from './carpool-offer.mjs';

const registerModel = (connection, name, schema) => {
  if (connection.models[name]) {
    return connection.models[name];
  }

  return connection.model(name, schema);
};

const buildModels = (connection) => ({
  User: registerModel(connection, 'User', UserSchema),
  Group: registerModel(connection, 'Group', GroupSchema),
  Event: registerModel(connection, 'Event', EventSchema),
  DiscussionThread: registerModel(connection, 'DiscussionThread', DiscussionThreadSchema),
  Album: registerModel(connection, 'Album', AlbumSchema),
  Poll: registerModel(connection, 'Poll', PollSchema),
  PollResponse: registerModel(connection, 'PollResponse', PollResponseSchema),
  TicketType: registerModel(connection, 'TicketType', TicketTypeSchema),
  Ticket: registerModel(connection, 'Ticket', TicketSchema),
  ShoppingItem: registerModel(connection, 'ShoppingItem', ShoppingItemSchema),
  CarpoolOffer: registerModel(connection, 'CarpoolOffer', CarpoolOfferSchema)
});

export default buildModels;
