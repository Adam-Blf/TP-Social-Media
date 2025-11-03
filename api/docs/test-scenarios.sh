#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:3000"
TMP_DIR=/tmp/tmp.Wf602MRlWK
trap 'rm -rf ""' EXIT

log() {
  printf '\n=== %s ===\n' ""
}

request() {
  local method=
  local path=
  local body=
  local output
  if [[ -z  ]]; then
    output=
  else
    output=
  fi
  echo "" | jq .
}

log "Santé API"
request GET /health

log "Création utilisateur admin"
ADMIN=
ADMIN_ID=

log "Création utilisateur membre"
MEMBER=
MEMBER_ID=

log "Création groupe"
GROUP=
GROUP_ID=

log "Création événement"
EVENT=;
EVENT_ID=

log "Ajout participant"
request POST /events//participants "{\"user\":\"\",\"status\":\"going\"}"

log "Création sondage"
POLL=
POLL_ID=
QUESTION_ID=
OPTION_ID=

log "Réponse sondage"
request POST /events//polls//responses "{\"respondent\":\"\",\"answers\":[{\"questionId\":\"\",\"optionId\":\"\"}] }"

log "Création type billet"
TICKET_TYPE=
TYPE_ID=

log "Achat billet"
request POST /events//ticketing/tickets "{\"ticketType\":\"\",\"attendee\":{\"firstName\":\"Invite\",\"lastName\":\"VIP\",\"email\":\"invite.vip@example.com\"}}"

log "Création album"
ALBUM=
ALBUM_ID=

log "Ajout photo"
PHOTO=
PHOTO_ID=

log "Shopping list"
ITEM=
ITEM_ID=

log "Covoiturage"
OFFER=
OFFER_ID=

log "Discussion"
THREAD=
THREAD_ID=

log "Message discussion"
request POST /events//discussions//messages "{\"author\":\"\",\"content\":\"On se retrouve à 18h !\"}"

log "Tests terminés"
